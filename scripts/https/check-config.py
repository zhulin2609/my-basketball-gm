import json
from pathlib import Path
import subprocess
import sys


def serialized_false():
    # 通过同一 Compose 的真实配置输出识别布尔字段省略规则，不猜测版本默认值。
    result = subprocess.run([
        "docker", "compose", "--project-name", "https-bind-policy-check",
        "--env-file", "/dev/null", "-f", str(Path(__file__).with_name("compose.bind-policy.yaml")),
        "config", "--format", "json",
    ], input="", capture_output=True, text=True, check=True)
    services = json.loads(result.stdout)["services"]
    disabled = services["creation-disabled"]["volumes"][0].get("bind", {}).get("create_host_path")
    enabled = services["creation-enabled"]["volumes"][0].get("bind", {}).get("create_host_path")
    if disabled is enabled or disabled not in (False, None) or enabled not in (True, None):
        raise ValueError("Compose 输出无法区分来源目录自动创建策略")
    return disabled


def require_file(path, label):
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"{label}必须是存在的非空普通文件")


def main():
    configuration = json.load(sys.stdin)
    disabled = serialized_false()
    volumes = configuration["services"]["web"]["volumes"]
    required = {
        "/etc/nginx/tls": "证书目录",
        "/etc/nginx/conf.d/default.conf": "NGINX 配置",
    }
    for target, label in required.items():
        matches = [volume for volume in volumes if volume["target"] == target]
        if len(matches) != 1:
            raise ValueError(f"{label}必须具有唯一挂载")
        volume = matches[0]
        if volume["type"] != "bind" or volume.get("read_only") is not True:
            raise ValueError(f"{label}必须使用只读 bind 挂载")
        if volume.get("bind", {}).get("create_host_path") is not disabled:
            raise ValueError(f"{label}必须禁止自动创建来源目录")
        source = Path(volume["source"])
        if not source.is_absolute():
            raise ValueError(f"{label}必须使用绝对路径")
        if target == "/etc/nginx/tls":
            if not source.is_dir():
                raise ValueError("证书目录不存在或类型错误")
            require_file(source / "fullchain.crt", "证书链")
            require_file(source / "private.key", "私钥")
        else:
            require_file(source, label)
    print("PASS HTTPS 挂载及文件预检")


if __name__ == "__main__":
    main()
