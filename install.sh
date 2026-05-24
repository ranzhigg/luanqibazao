#!/usr/bin/env bash
set -e

GREEN="\033[32m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} FULL AUTO Emby Reverse Proxy${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入域名: " DOMAIN
read -rp "输入Emby源站(https://xxx 或 http://xxx): " ORIGIN
read -rp "输入邮箱: " EMAIL

echo -e "${YELLOW}[1/7] 安装 nginx + 工具...${PLAIN}"
apt update
apt install -y nginx curl socat cron dnsutils

systemctl enable nginx
systemctl start nginx

echo -e "${YELLOW}[2/7] 放行防火墙(如果启用)...${PLAIN}"
ufw allow 80 || true
ufw allow 443 || true

echo -e "${YELLOW}[3/7] 先写 80 端口（用于签证书）...${PLAIN}"

mkdir -p /var/www/html/.well-known/acme-challenge

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

echo -e "${YELLOW}[4/7] 安装 acme.sh...${PLAIN}"

curl https://get.acme.sh | sh
export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

echo -e "${YELLOW}[5/7] 申请证书...${PLAIN}"

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

echo -e "${YELLOW}[6/7] 写入 HTTPS 反代配置...${PLAIN}"

cat > /etc/nginx/conf.d/${DOMAIN}-ssl.conf <<EOF

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/${DOMAIN}/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/${DOMAIN}/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 0;

    location ^~ / {

        proxy_pass ${ORIGIN};

        proxy_set_header Host \$proxy_host; 
        proxy_set_header X-Real-IP \$remote_addr; 
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; 
        proxy_set_header REMOTE-HOST \$remote_addr; 
        proxy_set_header Upgrade \$http_upgrade; 
        proxy_set_header Connection \$http_connection; 
        proxy_set_header X-Forwarded-Proto \$scheme; 

        proxy_http_version 1.1;

        add_header X-Cache \$upstream_cache_status;
        add_header Cache-Control no-cache;
        add_header Strict-Transport-Security "max-age=31536000";

        proxy_ssl_server_name on; 
        proxy_ssl_name \$proxy_host; 

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;

        proxy_buffering off;
        proxy_ignore_client_abort off;
        proxy_force_ranges on;
    }
}
EOF

echo -e "${YELLOW}[7/7] 启动服务...${PLAIN}"

nginx -t && systemctl restart nginx

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} 安装完成！${PLAIN}"
echo -e "${GREEN} https://${DOMAIN}${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"