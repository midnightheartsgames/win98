#!/usr/bin/env bash
set -euo pipefail

DOMAIN=pennygachi.men
HERE=$(cd "$(dirname "$0")" && pwd)
CF_INI=/root/.secrets/cloudflare.ini

if [ "$(id -u)" != 0 ]; then
  echo "Запустите от root: sudo bash $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot python3-certbot-dns-cloudflare ufw

install -d -m 700 /root/.secrets
if [ ! -s "$CF_INI" ]; then
  read -rsp "Токен Cloudflare (Zone > DNS > Edit для $DOMAIN): " token
  echo
  umask 077
  printf 'dns_cloudflare_api_token = %s\n' "$token" > "$CF_INI"
  unset token
fi
chmod 600 "$CF_INI"

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly --non-interactive --agree-tos --register-unsafely-without-email \
    --dns-cloudflare --dns-cloudflare-credentials "$CF_INI" --dns-cloudflare-propagation-seconds 30 \
    --cert-name "$DOMAIN" -d "$DOMAIN" -d "www.$DOMAIN" \
    --deploy-hook "systemctl reload nginx"
fi

install -d /etc/nginx/snippets
install -m 644 "$HERE/nginx/pennygachi-origin.conf" /etc/nginx/snippets/pennygachi-origin.conf
install -m 644 "$HERE/nginx/pennygachi.conf" /etc/nginx/conf.d/pennygachi.conf
rm -f /etc/nginx/sites-enabled/default
install -d -o www-data -g www-data /var/cache/nginx/pennygachi

nginx -t
systemctl enable nginx
systemctl restart nginx

ssh_port=$(sshd -T 2>/dev/null | awk '$1 == "port" { print $2; exit }')
ufw allow "${ssh_port:-22}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

ip=$(hostname -I | awk '{ print $1 }')
echo
echo "Готово. Проверка с ПК до переключения DNS:"
echo "  curl -I --resolve $DOMAIN:443:${ip:-<IP>} https://$DOMAIN/"
echo "Проверка у игроков: http://${ip:-<IP>}/vps-check"
