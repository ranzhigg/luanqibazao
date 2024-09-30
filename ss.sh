#!/bin/bash

# 配置参数
ADDRESS="0.0.0.0"      # 服务器地址
PORT=62400              # 服务器端口
METHOD="aes-256-gcm"    # 加密方法
PASSWORD="weiwei"       # 密码
TIMEOUT=300             # 超时时间

# 安装 Shadowsocks-Rust
echo "正在安装 Shadowsocks-Rust..."
brew install shadowsocks-rust

# 创建配置文件
CONFIG_PATH=~/config.json
cat <<EOF > $CONFIG_PATH
{
    "servers": [
        {
            "address": "$ADDRESS",
            "port": $PORT,
            "method": "$METHOD",
            "password": "$PASSWORD",
            "timeout": $TIMEOUT
        }
    ]
}
EOF

echo "配置文件已生成：$CONFIG_PATH"

# 启动 Shadowsocks-Rust 服务
echo "正在启动 Shadowsocks-Rust 服务..."
brew services start shadowsocks-rust

# 加载新配置（如果需要重启服务）
echo "重启 Shadowsocks-Rust 服务以应用配置..."
brew services restart shadowsocks-rust

echo "Shadowsocks-Rust 已安装并配置完成！"