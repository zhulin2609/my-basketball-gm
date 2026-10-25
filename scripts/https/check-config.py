import json
from pathlib import Path
import sys


def require_file(path, label):
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"{label}必须是存在的非空普通文件")


def main():
    configuration = json.load(sys.stdin)
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
        if volume.get("bind", {}).get("create_host_path") is not False:
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
