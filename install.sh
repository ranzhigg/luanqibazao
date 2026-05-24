#!/usr/bin/env bash
set -e

GREEN="\033[32m"
YELLOW="\033[33m"
PLAIN="\033[0m"

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} Emby Reverse Proxy ULTRA Edition${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"

read -rp "输入你的域名: " DOMAIN
read -rp "输入Emby源站 (http://IP:8096): " ORIGIN
read -rp "输入邮箱: " EMAIL

echo -e "${YELLOW}[1/6] 安装依赖...${PLAIN}"

apt update
apt install -y nginx curl socat cron dnsutils

systemctl enable nginx
systemctl start nginx

echo -e "${YELLOW}[2/6] 安装 acme.sh...${PLAIN}"

curl https://get.acme.sh | sh
export PATH="$HOME/.acme.sh:$PATH"

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

mkdir -p /etc/nginx/ssl/${DOMAIN}

echo -e "${YELLOW}[3/6] 申请证书...${PLAIN}"

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

echo -e "${YELLOW}[4/6] 写入 ULTRA Nginx 配置...${PLAIN}"

cat > /etc/nginx/conf.d/emby-ultra.conf <<EOF

# ========================
# WebSocket Connection Map
# ========================
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

# ========================
# Upstream Keepalive
# ========================
upstream emby_backend {
    server ${ORIGIN} max_fails=3 fail_timeout=30s;
    keepalive 64;
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

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:20m;
    ssl_session_timeout 10m;

    client_max_body_size 0;

    # ========================
    # ULTRA STREAM OPTIMIZE
    # ========================
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_max_temp_file_size 0;

    proxy_http_version 1.1;

    keepalive_timeout 120;
    keepalive_requests 10000;

    tcp_nodelay on;
    sendfile on;

    # ========================
    # TIMEOUTS (stream friendly)
    # ========================
    proxy_connect_timeout 60s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;

    location / {

        proxy_pass http://emby_backend;

        # ========================
        # Headers
        # ========================
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket safe
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;

        # ========================
        # STREAM OPTIMIZATION
        # ========================
        proxy_force_ranges on;
        chunked_transfer_encoding off;

        # TLS upstream optimization
        proxy_ssl_server_name on;
        proxy_ssl_name \$host;

        # ========================
        # Disable caching artifacts
        # ========================
        proxy_cache off;
    }
}
EOF

echo -e "${YELLOW}[5/6] Nginx检测...${PLAIN}"

nginx -t

echo -e "${YELLOW}[6/6] 重启服务...${PLAIN}"

systemctl restart nginx

echo -e "${GREEN}========================================${PLAIN}"
echo -e "${GREEN} ULTRA版安装完成${PLAIN}"
echo -e "${GREEN} https://${DOMAIN}${PLAIN}"
echo -e "${GREEN}========================================${PLAIN}"