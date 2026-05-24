#!/usr/bin/env bash
set -e

GREEN="\033[32m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} ZERO FAIL Emby Reverse Proxy${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入你的域名: " DOMAIN
read -rp "输入Emby源站 (http/https都可以): " ORIGIN
read -rp "输入邮箱: " EMAIL

echo -e "${YELLOW}[1/6] 安装依赖...${PLAIN}"
apt update
apt install -y nginx curl socat cron dnsutils

systemctl enable nginx
systemctl start nginx

echo -e "${YELLOW}[2/6] 创建 webroot...${PLAIN}"
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html

echo -e "${YELLOW}[3/6] 写入 Nginx（先只跑80端口）...${PLAIN}"

cat > /etc/nginx/conf.d/${DOMAIN}.conf <<EOF

server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 200 "OK";
    }
}
EOF

nginx -t && systemctl reload nginx

echo -e "${YELLOW}[4/6] 安装 acme.sh...${PLAIN}"
curl https://get.acme.sh | sh
export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

echo -e "${YELLOW}[5/6] 申请证书（webroot稳定模式）...${PLAIN}"

~/.acme.sh/acme.sh --issue \
  -d "${DOMAIN}" \
  --webroot /var/www/html \
  --keylength ec-256 \
  --force

mkdir -p /etc/nginx/ssl/${DOMAIN}

~/.acme.sh/acme.sh --install-cert -d "${DOMAIN}" \
--ecc \
--fullchain-file /etc/nginx/ssl/${DOMAIN}/fullchain.cer \
--key-file /etc/nginx/ssl/${DOMAIN}/private.key \
--reloadcmd "systemctl reload nginx"

echo -e "${YELLOW}[6/6] 写入 443 反代（最终版）...${PLAIN}"

cat > /etc/nginx/conf.d/${DOMAIN}-ssl.conf <<EOF

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

upstream emby_backend {
    server ${ORIGIN#https://} max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/${DOMAIN}/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/${DOMAIN}/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;

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

        proxy_connect_timeout 60s;
        proxy_read_timeout 3600s;

        proxy_ssl_server_name on;
        proxy_ssl_verify off;
    }
}
EOF

nginx -t && systemctl restart nginx

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} 安装完成（ZERO FAIL版本）${PLAIN}"
echo -e "${GREEN} https://${DOMAIN}${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"