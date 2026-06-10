#!/bin/sh
set -e

VAULT_CONTAINER="vault"

echo "Loading secrets..."

ls -l srcs/vault/secrets/

for file in srcs/vault/secrets/*.json; do
  name=$(basename "$file" .json)

  echo " → Loading secret $name"

  docker exec \
    -e VAULT_ADDR=http://vault:8200 \
    -e VAULT_TOKEN=root \
    $VAULT_CONTAINER \
    vault kv put secret/$name @/vault/secrets/$name.json
done
