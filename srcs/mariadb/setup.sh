#!/bin/bash
set -e

#----------------------contenaire env setup--------------------------------------------------------

echo "[entrypoint] Waiting for Vault..."
until curl -s $VAULT_ADDR/v1/sys/health > /dev/null; do
  sleep 1
done

echo "[entrypoint] Authenticating to Vault..."

TOKEN=$(curl -s \
  --request POST \
  --data "{\"role_id\":\"$VAULT_ROLE_ID\", \"secret_id\":\"$VAULT_SECRET_ID\"}" \
  $VAULT_ADDR/v1/auth/approle/login | jq -r '.auth.client_token')


if [ -z "$TOKEN" ]; then
  echo "[entrypoint] ERROR: Vault authentication failed"
  exit 1
fi

echo "[entrypoint] Fetching secrets..."
SECRETS=$(curl -s \
  --header "X-Vault-Token: $TOKEN" \
  $VAULT_ADDR/v1/secret/data/mariadb-service | jq -r '.data.data')

export DB_HOST=$(echo "$SECRETS" | jq -r '.DB_HOST')
export DB_USER=$(echo "$SECRETS" | jq -r '.DB_USER')
export DB_NAME=$(echo "$SECRETS" | jq -r '.DB_NAME')
export DB_PASSWORD=$(echo "$SECRETS" | jq -r '.DB_PASSWORD')

#--------------------------------------------------------------------------------------------------

if [ ! -d "/var/lib/mysql/mysql" ]; then
    mariadb-install-db --user=mysql --datadir=/var/lib/mysql
fi

mysqld_safe &
pid="$!"

until mariadb -u root -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done

echo "DB_HOST = ${DB_HOST}"
echo "DB_USER = ${DB_USER}"
echo "DB_NAME = ${DB_NAME}"
echo "db_password = ${DB_PASSWORD}"
#DB_PASSWORD=$(cat /run/secrets/db_password)

mariadb -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
ALTER USER IF EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
EOF

wait $pid
