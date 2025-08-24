#!/bin/bash
mv /etc/apt/sources.list.d/nginx.list /etc/apt/sources.list.d/nginx.list.bak 2>/dev/null || true
apt-get update && apt-get install -y ca-certificates curl gnupg lsb-release
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker -v && docker compose version
mkdir -p ~/danmuku/mysql-data ~/danmuku/config && cd ~/danmuku
cat > docker-compose.yaml <<'YAML'
version: "3.8"
services:
  mysql:
    image: mysql:8.1.0-oracle
    container_name: danmu-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_DATABASE: "danmuapi"
      MYSQL_USER: "admin"
      MYSQL_PASSWORD: "admin"
      TZ: "Asia/Shanghai"
    volumes:
      - ./mysql-data:/var/lib/mysql
    command:
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --explicit_defaults_for_timestamp=true
    healthcheck:
      test: ["CMD-SHELL", "mysql -uadmin -p'admin' -e \"SELECT 1\" danmuapi"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 30s
    networks:
      - misaka-net
  danmu-app:
    image: l429609201/misaka_danmu_server:latest
    container_name: misaka-danmu-server
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - PUID=1000
      - PGID=1000
      - UMASK=0022
      - DANMUAPI_DATABASE__TYPE=mysql
      - DANMUAPI_DATABASE__HOST=mysql
      - DANMUAPI_DATABASE__PORT=3306
      - DANMUAPI_DATABASE__NAME=danmuapi
      - DANMUAPI_DATABASE__USER=admin
      - DANMUAPI_DATABASE__PASSWORD=admin
      - DANMUAPI_ADMIN__INITIAL_USER=admin
    volumes:
      - ./config:/app/config
    ports:
      - "7768:7768"
    networks:
      - misaka-net
networks:
  misaka-net:
    driver: bridge
YAML
docker compose up -d
systemctl enable docker
docker update --restart=always danmu-mysql danmu-app || true
echo "Misaka danmaku server started. Access at http://your_server_ip:7768"