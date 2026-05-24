#!/usr/bin/env bash

# =========================================================
# Emby/Jellyfin Nginx Reverse Proxy Auto Installer
# 支持:
# - HTTPS (Let's Encrypt)
# - HTTP/2
# - Emby/Infuse优化
# - Upstream KeepAlive
# - 自动续期
# Tested: Ubuntu 22+/Debian 12+
# =========================================================

set -e

GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} Emby Reverse Proxy Installer${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入你的域名: " DOMAIN
read -rp "输入Emby/Jellyfin源站 (例如 http://1.1.1.1:8096): " ORIGIN
read -rp "输入邮箱 (Let's Encrypt): " EMAIL

echo
echo -e "${YELLOW}开始安装依赖...${PLAIN}"

apt update
apt install -y nginx curl socat cron

echo
echo -e "${YELLOW}安装 acme.sh ...${PLAIN}"

curl https://get.acme.sh | sh

export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

echo
echo -e "${YELLOW}申请证书...${PLAIN}"

mkdir -p /var/www/html

systemctl stop nginx || true

~/.acme.sh/acme.sh \
  --issue \
  -d "${DOMAIN}" \
  --standalone \
  --keylength ec-256 \
  --accountemail "${EMAIL}"

mkdir -p /etc/nginx/ssl/${DOMAIN}

~/.acme.sh/acme.sh --install-cert -d "${DOMAIN}" \
--ecc \
--fullchain-file /etc/nginx/ssl/${DOMAIN}/fullchain.cer \
--key-file /etc/nginx/ssl/${DOMAIN}/private.key \
--reloadcmd "systemctl reload nginx"

echo
echo -e "${YELLOW}生成 Nginx 配置...${PLAIN}"

cat > /etc/nginx/conf.d/emby.conf <<EOF

upstream emby_backend {
    server ${ORIGIN#http://};
    keepalive 128;
}

server {
    listen 80;
    server_name ${DOMAIN};

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/${DOMAIN}/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/${DOMAIN}/private.key;

    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;

    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000" always;

    client_max_body_size 0;

    proxy_buffering on;
    proxy_request_buffering off;

    proxy_buffers 256 16k;
    proxy_buffer_size 32k;

    tcp_nopush on;
    tcp_nodelay on;

    sendfile on;
    aio threads;

    keepalive_timeout 65;
    keepalive_requests 10000;

    location / {

        proxy_pass ${ORIGIN};

        proxy_http_version 1.1;

        proxy_set_header Connection "";

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;

        proxy_ssl_server_name on;

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;

        proxy_force_ranges on;

        chunked_transfer_encoding off;

        add_header X-Cache \$upstream_cache_status;
        add_header Cache-Control no-cache;
    }
}

EOF

echo
echo -e "${YELLOW}优化系统 TCP 参数...${PLAIN}"

cat >> /etc/sysctl.conf <<EOF

# Emby Streaming Optimize
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr

net.core.rmem_max=67108864
net.core.wmem_max=67108864

net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864

net.ipv4.tcp_fastopen=3
net.ipv4.tcp_mtu_probing=1

EOF

sysctl -p

echo
echo -e "${YELLOW}测试 Nginx 配置...${PLAIN}"

nginx -t

systemctl enable nginx
systemctl restart nginx

echo
echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} 安装完成!${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"
echo
echo -e "访问地址:"
echo -e "${GREEN}https://${DOMAIN}${PLAIN}"
echo
echo -e "${YELLOW}已启用:${PLAIN}"
echo "- HTTPS"
echo "- HTTP/2"
echo "- KeepAlive"
echo "- BBR"
echo "- Emby/Infuse优化"
echo "- 自动续期"
echo