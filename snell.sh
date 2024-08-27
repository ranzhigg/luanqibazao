#!/bin/bash

# 定义Snell版本和下载链接
SNELL_VERSION="v4.1.0"
SNELL_URL="https://dl.nssurge.com/snell/snell-server-v4.1.0b1-linux-amd64.zip"

# 更新系统包并安装必要的软件
apt update && apt upgrade -y && apt install -y wget openssl unzip vim git

# 下载并解压Snell服务器
wget $SNELL_URL -O snell.zip
unzip snell.zip -d /usr/local/bin
rm snell.zip

# 赋予执行权限
chmod +x /usr/local/bin/snell-server

# 创建配置文件目录
mkdir -p /etc/snell

# 生成随机的psk
PSK=$(openssl rand -base64 12)

# 创建Snell配置文件
cat > /etc/snell/snell-server.conf << EOF
[snell-server]
dns = 1.1.1.1, 9.9.9.9, 2606:4700:4700::1111
listen = 0.0.0.0:16386
psk = $PSK
ipv6 = false
EOF

# 创建Snell服务
cat > /etc/systemd/system/snell.service << EOF
[Unit]
Description=Snell Proxy Service
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service

[Service]
Type=simple
DynamicUser=yes
LimitNOFILE=32768
ExecStart=/usr/local/bin/snell-server -c /etc/snell/snell-server.conf
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动Snell服务
sudo systemctl daemon-reload
sudo systemctl enable snell
sudo systemctl start snell

# 调整 kernel 网络性能,并开启 BBR
echo "Network tuning..."
cat <<EOF >> /etc/sysctl.conf
net.core.rmem_default = 262144
net.core.rmem_max = 6291456
net.core.wmem_default = 262144
net.core.wmem_max = 4194304
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_ecn = 1
EOF

sysctl -p

# 输出PSK
echo "Snell PSK: $PSK"
