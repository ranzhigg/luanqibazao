#!/usr/bin/env bash
set -e

read -rp "输入域名: " DOMAIN
read -rp "输入Emby源站(https://xxx 或 http://xxx): " ORIGIN

cat > /etc/nginx/conf.d/${DOMAIN}.conf <<EOF

location ^~ / {

    proxy_pass ${ORIGIN};

    proxy_http_version 1.1;

    proxy_set_header Host \$proxy_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;

    proxy_ssl_server_name on;
    proxy_ssl_name \$proxy_host;
    proxy_ssl_verify off;

    proxy_force_ranges on;
    chunked_transfer_encoding off;

    proxy_buffering off;
    proxy_request_buffering off;
    proxy_max_temp_file_size 0;

    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    add_header X-Cache \$upstream_cache_status;
    add_header Cache-Control no-cache;
    add_header Strict-Transport-Security "max-age=31536000";

    proxy_ignore_client_abort off;
}
EOF

nginx -t && systemctl reload nginx

echo "完成：https://${DOMAIN}"