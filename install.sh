#!/usr/bin/env bash
set -e

GREEN="\033[32m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} Emby Reverse Proxy ULTRA FIXED${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入你的域名: " DOMAIN
read -rp "输入Emby源站(支持 http 或 https: ): " ORIGIN
read -rp "输入邮箱: " EMAIL

echo -e "${YELLOW}[1/5] 安装依赖...${PLAIN}"

apt update
apt install -y nginx curl socat cron dnsutils

systemctl enable nginx
systemctl start nginx

echo -e "${YELLOW}[2/5] 先写 Nginx 配置（关键修复点）...${PLAIN}"

mkdir -p /etc/nginx/ssl/${DOMAIN}

cat > /etc/nginx/conf.d/emby.conf <<EOF

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

upstream emby_backend {
    server ${ORIGIN#https://} max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass ${ORIGIN};

        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;

        proxy_force_ranges on;

        proxy_buffering off;
        proxy_request_buffering off;
        proxy_max_temp_file_size 0;

        proxy_connect_timeout 60s;
        proxy_read_timeout 3600s;

        proxy_ssl_server_name on;
        proxy_ssl_verify off;
    }
}
EOF

nginx -t
systemctl reload nginx

echo -e "${YELLOW}[3/5] 安装 acme.sh...${PLAIN}"

curl https://get.acme.sh | sh
export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

echo -e "${YELLOW}[4/5] 申请证书（webroot稳定模式）...${PLAIN}"

# ⚠️ 修复点：不用 --nginx 模式，避免报错
~/.acme.sh/acme.sh --issue \
  -d "${DOMAIN}" \
  --webroot /var/www/html \
  --keylength ec-256 \
  --force

~/.acme.sh/acme.sh --install-cert -d "${DOMAIN}" \
--ecc \
--fullchain-file /etc/nginx/ssl/${DOMAIN}/fullchain.cer \
--key-file /etc/nginx/ssl/${DOMAIN}/private.key \
--reloadcmd "systemctl reload nginx"

echo -e "${YELLOW}[5/5] 写入 HTTPS Server...${PLAIN}"

cat > /etc/nginx/conf.d/emby-ssl.conf <<EOF

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/${DOMAIN}/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/${DOMAIN}/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:20m;

    client_max_body_size 0;

    proxy_buffering off;
    proxy_request_buffering off;
    proxy_max_temp_file_size 0;

    proxy_http_version 1.1;

    location / {

        proxy_pass ${ORIGIN};

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;

        proxy_force_ranges on;
        chunked_transfer_encoding off;

        proxy_connect_timeout 60s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;

        proxy_ssl_server_name on;
        proxy_ssl_verify off;
    }
}
EOF

nginx -t
systemctl restart nginx

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} 安装完成！${PLAIN}"
echo -e "${GREEN} https://${DOMAIN}${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"