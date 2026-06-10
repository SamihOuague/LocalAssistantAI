#!/bin/sh
set -e

VAULT_CONTAINER="vault"

echo "Creating AppRoles..."

for file in srcs/vault/policies/*.hcl; do
  policy=$(basename "$file" .hcl)

  echo " → Creating AppRole for $policy"

  docker exec \
    -e VAULT_ADDR=http://vault:8200 \
    -e VAULT_TOKEN=root \
    $VAULT_CONTAINER \
    vault write auth/approle/role/$policy \
      policies="$policy" \
      token_ttl=1h \
      token_max_ttl=4h
done


