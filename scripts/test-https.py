import base64
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import uuid


ROOT = Path(__file__).resolve().parents[1]


class HttpsChecks:
    def __init__(self):
        self.project = f"https-origin-{uuid.uuid4().hex[:12]}"
        self.directory = ROOT / ".cache" / "https-origin" / self.project
        self.directory.mkdir(parents=True, mode=0o700)
        self.tls = self.directory / "tls"
        self.tls.mkdir(parents=True, mode=0o700)
        self.env = {
            **os.environ,
            "POSTGRES_DB": "https_origin",
            "POSTGRES_USER": "https_test",
            "POSTGRES_PASSWORD": secrets.token_hex(32),
            "JWT_SECRET": secrets.token_hex(32),
            "LLM_CREDENTIAL_ENCRYPTION_KEY": base64.b64encode(secrets.token_bytes(32)).decode(),
            "FORUM_ENABLED": "false",
            "FORUM_ADMIN_USERNAMES": "",
            "WECHAT_MINI_APPID": "",
            "WECHAT_MINI_SECRET": "",
            "TENCENT_SECRET_ID": "",
            "TENCENT_SECRET_KEY": "",
            "WEB_HTTP_PORT": "80",
            "HTTPS_TLS_DIRECTORY": str(self.tls),
            "HTTPS_NGINX_CONFIG": str(ROOT / "deploy/nginx/https.conf"),
        }
        self.checks = []
        self.phase = "setup"

    def compose_command(self, *arguments, https=True, before=False):
        command = [
            "docker", "compose", "--project-name", self.project,
            "--project-directory", str(ROOT), "--env-file", "/dev/null",
            "-f", str(ROOT / "compose.yaml"),
        ]
        if https:
            command += ["-f", str(ROOT / "deploy/compose.https.yaml")]
        command += ["-f", str(ROOT / "scripts/https/compose.test.yaml")]
        if before:
            command += ["-f", str(ROOT / "scripts/https/compose.before-fix.yaml")]
        command += list(arguments)
        return command

    def compose(self, *arguments, https=True, before=False, capture=False):
        command = self.compose_command(*arguments, https=https, before=before)
        if capture:
            return subprocess.run(command, env=self.env, check=True, capture_output=True, text=True).stdout
        with (self.directory / "compose.log").open("a") as log:
            subprocess.run(command, env=self.env, check=True, stdout=log, stderr=log)
        return None

    def configuration_checks(self):
        for label, value in (("未设置", None), ("空值", "")):
            environment = dict(self.env)
            if value is None:
                del environment["HTTPS_TLS_DIRECTORY"]
            else:
                environment["HTTPS_TLS_DIRECTORY"] = value
            result = subprocess.run(self.compose_command("config", "--quiet"), env=environment,
                                    capture_output=True, text=True, check=False)
            self.check(result.returncode != 0 and "HTTPS_TLS_DIRECTORY is required" in result.stderr,
                       f"证书目录变量{label}时 Compose 拒绝配置")

        # 每个负向案例使用真实文件和 Compose 输出，不接触生产目录。
        absent = self.directory / "absent"
        empty = self.directory / "empty-tls"
        empty.mkdir()
        certificate_only = self.directory / "certificate-only"
        certificate_only.mkdir()
        shutil.copyfile(self.tls / "fullchain.crt", certificate_only / "fullchain.crt")
        key_only = self.directory / "key-only"
        key_only.mkdir()
        shutil.copyfile(self.tls / "private.key", key_only / "private.key")
        (key_only / "private.key").chmod(0o600)
        cases = (
            ("HTTPS_TLS_DIRECTORY", absent, "证书目录不存在或类型错误"),
            ("HTTPS_TLS_DIRECTORY", self.tls / "fullchain.crt", "证书目录不存在或类型错误"),
            ("HTTPS_TLS_DIRECTORY", empty, "证书链必须"),
            ("HTTPS_TLS_DIRECTORY", certificate_only, "私钥必须"),
            ("HTTPS_TLS_DIRECTORY", key_only, "证书链必须"),
            ("HTTPS_NGINX_CONFIG", absent, "NGINX 配置必须"),
        )
        for variable, value, error in cases:
            environment = {**self.env, variable: str(value)}
            configuration = subprocess.run(self.compose_command("config", "--format", "json"),
                                           env=environment, capture_output=True, text=True, check=True).stdout
            result = subprocess.run([sys.executable, str(ROOT / "scripts/https/check-config.py")],
                                    input=configuration, capture_output=True, text=True, check=False)
            self.check(result.returncode != 0 and error in result.stderr, f"配置预检拒绝：{error}")
        self.check(not absent.exists(), "预检未创建缺失来源路径")
        configuration = self.compose("config", "--format", "json", capture=True)
        subprocess.run([sys.executable, str(ROOT / "scripts/https/check-config.py")],
                       input=configuration, capture_output=True, text=True, check=True)
        self.check(True, "实际证书和 NGINX 配置通过预检")
        volumes = json.loads(configuration)["services"]["web"]["volumes"]
        for target in ("/etc/nginx/tls", "/etc/nginx/conf.d/default.conf"):
            volume = next(item for item in volumes if item["target"] == target)
            self.check(volume["read_only"], f"{target} 配置为只读挂载")
        unsafe_command = self.compose_command()
        unsafe_command += ["-f", str(ROOT / "scripts/https/compose.unsafe-bind.yaml"),
                           "config", "--format", "json"]
        unsafe_configuration = subprocess.run(unsafe_command, env=self.env, capture_output=True,
                                               text=True, check=True).stdout
        result = subprocess.run([sys.executable, str(ROOT / "scripts/https/check-config.py")],
                                input=unsafe_configuration, capture_output=True, text=True, check=False)
        self.check(result.returncode != 0 and "必须禁止自动创建来源目录" in result.stderr,
                   "预检拒绝真实 Compose 配置中的 create_host_path=true")

    def check(self, condition, label):
        if not condition:
            raise AssertionError(f"{self.phase}: {label}; 日志目录 {self.directory}")
        self.checks.append(f"{self.phase}: {label}")
        print(f"PASS {self.phase}: {label}", flush=True)

    def request(self, url, expected, *, method="GET", origin=None, payload=None,
                headers=None, https=True):
        # curl 保留 URL 的域名、标准端口、SNI 与 Origin，仅把连接转到隔离容器。
        command = [
            "curl", "--silent", "--show-error", "--noproxy", "*",
            "--connect-timeout", "5", "--max-time", "20",
            "--request", method, "--write-out", "%{stderr}%{json}",
        ]
        if https:
            for host in ("link9.fun", "www.link9.fun"):
                command += ["--connect-to", f"{host}:443:{self.https_address}"]
            command += ["--cacert", str(self.tls / "fullchain.crt")]
        else:
            for host in ("link9.fun", "www.link9.fun"):
                command += ["--connect-to", f"{host}:80:{self.http_address}"]
        if origin:
            command += ["--header", f"Origin: {origin}"]
        request_headers = dict(headers or {})
        token = request_headers.pop("Authorization", None)
        for name, value in request_headers.items():
            command += ["--header", f"{name}: {value}"]
        stdin = None
        if payload is not None:
            if token:
                raise ValueError("当前测试不同时提交 JSON 和 Authorization")
            command += ["--header", "Content-Type: application/json", "--data-binary", "@-"]
            stdin = json.dumps(payload)
        if token:
            command += ["--header", "@-"]
            stdin = f"Authorization: {token}\n"
        # 密码和 token 只经标准输入传递，响应体只保留在进程内存。
        result = subprocess.run(command + [url], input=stdin, capture_output=True, text=True, check=True)
        metadata = json.loads(result.stderr)
        self.check(metadata["http_code"] == expected, f"{method} {url} Origin={origin} HTTP {expected}")
        return result.stdout, metadata

    def login_checks(self, base, origin, *, https):
        credentials = {"username": "tls-" + secrets.token_hex(6), "password": secrets.token_hex(24)}
        self.request(base + "/api/v1/auth/register", 201, method="POST", origin=origin,
                     payload=credentials, https=https)
        body, _ = self.request(base + "/api/v1/auth/login", 200, method="POST", origin=origin,
                               payload=credentials, https=https)
        session = json.loads(body)
        self.check(bool(session["accessToken"]) and session["tokenType"] == "Bearer", "登录签发 token")
        body, _ = self.request(base + "/api/v1/auth/me", 200, origin=origin,
                               headers={"Authorization": "Bearer " + session["accessToken"]}, https=https)
        self.check(json.loads(body)["username"] == credentials["username"], "真实 token 可访问本人账号")
        body, _ = self.request(base + "/api/v1/auth/login", 401, method="POST", origin=origin,
                               payload={**credentials, "password": secrets.token_hex(24)}, https=https)
        self.check("用户名或密码错误" in body, "错误密码返回业务认证错误")
        self.request(base + "/api/v1/auth/me", 401, origin=origin, https=https)

    def run(self):
        print(f"隔离 Compose 项目 {self.project}；证据目录 {self.directory}", flush=True)
        # 测试专用的短期证书，不使用生产证书，也不关闭 TLS 校验。
        with (self.directory / "certificate.log").open("w") as log:
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                "-keyout", str(self.tls / "private.key"), "-out", str(self.tls / "fullchain.crt"),
                "-subj", "/CN=link9.fun", "-addext", "subjectAltName=DNS:link9.fun,DNS:www.link9.fun",
            ], check=True, stdout=log, stderr=log)
        (self.tls / "private.key").chmod(0o600)
        self.configuration_checks()
        configuration = json.loads(self.compose("config", "--format", "json", capture=True))
        api = configuration["services"]["api"]
        self.check(not api.get("ports"), "后端没有宿主机发布端口")
        self.check(api["environment"]["SERVER_FORWARD_HEADERS_STRATEGY"] == "native", "HTTPS 启用 native")
        self.check(not configuration["services"]["postgres"].get("ports"), "测试数据库没有宿主机发布端口")
        try:
            print("构建当前源码的 Web/API 镜像", flush=True)
            self.compose("build", "web", "api")
            self.phase = "before-fix"
            self.compose("up", "--detach", "--wait", "--wait-timeout", "180", before=True)
            self.https_address = self.compose("port", "web", "443", capture=True).strip()
            self.http_address = self.compose("port", "web", "80", capture=True).strip()
            container = self.compose("ps", "--quiet", "web", capture=True).strip()
            mounts = json.loads(subprocess.run(
                ["docker", "inspect", container, "--format", "{{json .Mounts}}"],
                check=True, capture_output=True, text=True).stdout)
            for target in ("/etc/nginx/tls", "/etc/nginx/conf.d/default.conf"):
                mount = next(item for item in mounts if item["Destination"] == target)
                self.check(mount["RW"] is False, f"实际容器只读挂载 {target}")
            result = subprocess.run(self.compose_command(
                "exec", "-T", "web", "touch", "/etc/nginx/tls/write-probe"),
                env=self.env, check=False, capture_output=True, text=True)
            self.check(result.returncode != 0 and "Read-only file system" in result.stderr,
                       "实际容器拒绝在证书目录创建文件")
            for host in ("link9.fun", "www.link9.fun"):
                base = f"https://{host}"
                self.request(base + "/api/v1/health", 200)
                body, _ = self.request(base + "/api/v1/auth/login", 403, method="POST", origin=base,
                                       payload={"username": "baseline", "password": secrets.token_hex(24)})
                self.check(body == "Invalid CORS request", "重现 HTTPS Origin 登录被 CORS 拒绝")

            self.phase = "https"
            self.compose("up", "--detach", "--no-deps", "--wait", "--wait-timeout", "180", "api")
            self.compose("exec", "-T", "web", "nginx", "-t")
            for host in ("link9.fun", "www.link9.fun"):
                base = f"https://{host}"
                self.request(base + "/", 200)
                body, _ = self.request(base + "/api/v1/health", 200, origin=base)
                self.check(json.loads(body)["status"] == "ok", "携带 Origin 的健康响应内容")
                self.request(base + "/api/v1/auth/login", 200, method="OPTIONS", origin=base,
                             headers={"Access-Control-Request-Method": "POST",
                                      "Access-Control-Request-Headers": "content-type"})
                self.login_checks(base, base, https=True)
                for method in ("POST", "OPTIONS"):
                    self.request(base + "/api/v1/auth/login", 403, method=method,
                                 origin="https://untrusted.example",
                                 headers={"Access-Control-Request-Method": "POST"})
                spoofed = {
                    "X-Forwarded-Proto": "http", "X-Forwarded-Host": "untrusted.example",
                    "X-Forwarded-Port": "80", "X-Forwarded-For": "203.0.113.10",
                    "Forwarded": "proto=http;host=untrusted.example",
                }
                self.request(base + "/api/v1/health", 200, origin=base, headers=spoofed)
                self.request(base + "/api/v1/health", 403, origin=f"http://{host}", headers=spoofed)
                self.request(base + "/api/v1/health", 403, origin="https://untrusted.example", headers=spoofed)
                _, metadata = self.request(f"http://{host}/?probe=origin", 308, https=False)
                self.check(metadata["redirect_url"] == base + "/?probe=origin", "HTTP 跳转保留域名和查询参数")

            # 用同一源码镜像重新创建测试 Web/API，恢复基础 Compose 的 HTTP 配置。
            self.phase = "local-http"
            self.compose("up", "--detach", "--no-deps", "--wait", "--wait-timeout", "180", "api", "web", https=False)
            self.http_address = self.compose("port", "web", "80", https=False, capture=True).strip()
            base = "http://" + self.http_address
            self.request(base + "/api/v1/health", 200, origin=base, https=False)
            self.login_checks(base, base, https=False)
            self.request(base + "/api/v1/health", 200, origin="http://localhost:5173", https=False)
            self.request(base + "/api/v1/health", 403, origin="https://untrusted.example", https=False)
            print(f"全部 {len(self.checks)} 项检查通过", flush=True)
        finally:
            (self.directory / "checks.json").write_text(json.dumps(self.checks, ensure_ascii=False, indent=2))
            try:
                self.compose("logs", "--no-color", "--tail", "100")
            finally:
                # 只停止本次随机项目，保留测试数据库卷及日志用于复核。
                self.compose("stop", "--timeout", "20")


if __name__ == "__main__":
    HttpsChecks().run()
