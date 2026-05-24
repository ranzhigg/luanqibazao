#!/usr/bin/env bash
set -e

GREEN="\033[32m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} Emby Reverse Proxy Installer PRO${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入你的域名: " DOMAIN
read -rp "输入Emby源站 (推荐 http://IP:8096): " ORIGIN
read -rp "输入邮箱: " EMAIL

echo -e "${YELLOW}[1/6] 安装依赖...${PLAIN}"

apt update
apt install -y nginx curl socat cron dnsutils

systemctl enable nginx
systemctl start nginx

echo -e "${YELLOW}[2/6] 检查域名解析...${PLAIN}"

IP=$(dig +short $DOMAIN | tail -n1)

if [ -z "$IP" ]; then
  echo "❌ 域名未解析到服务器，先去DNS加A记录"
  exit 1
fi

echo "解析到: $IP"

echo -e "${YELLOW}[3/6] 安装 acme.sh...${PLAIN}"

curl https://get.acme.sh | sh
export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

mkdir -p /etc/nginx/ssl/${DOMAIN}

echo -e "${YELLOW}[4/6] 申请证书（nginx模式）...${PLAIN}"

# 强制 nginx 模式（稳定）
~/.acme.sh/acme.sh --issue \
  -d "${DOMAIN}" \
  --nginx \
  --keylength ec-256 \
  --force

~/.acme.sh/acme.sh --install-cert -d "${DOMAIN}" \
--ecc \
--fullchain-file /etc/nginx/ssl/${DOMAIN}/fullchain.cer \
--key-file /etc/nginx/ssl/${DOMAIN}/private.key \
--reloadcmd "systemctl reload nginx"

echo -e "${YELLOW}[5/6] 写入 Nginx 配置...${PLAIN}"

cat > /etc/nginx/conf.d/emby.conf <<EOF

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

    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 0;

    # ===== Emby优化核心 =====
    proxy_buffering on;
    proxy_request_buffering off;

    proxy_buffers 256 16k;
    proxy_buffer_size 64k;

    proxy_http_version 1.1;

    keepalive_timeout 65;

    location / {

        proxy_pass ${ORIGIN};

        # 必须头
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # websocket / Infuse
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # TLS优化
        proxy_ssl_server_name on;

        # 流媒体关键
        proxy_force_ranges on;
        chunked_transfer_encoding off;

        # 超时
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

echo -e "${YELLOW}[6/6] 启动服务...${PLAIN}"

nginx -t
systemctl restart nginx

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} 安装完成！${PLAIN}"
echo -e "${GREEN} https://${DOMAIN}${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"