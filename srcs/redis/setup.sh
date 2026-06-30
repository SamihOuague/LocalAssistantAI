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
  $VAULT_ADDR/v1/secret/data/chatllm-service | jq -r '.data.data')

export REDIS_PASSWORD=$(echo "$SECRETS" | jq -r '.REDIS_PASSWORD')

redis-server /usr/local/etc/redis/redis.conf --requirepass $REDIS_PASSWORD