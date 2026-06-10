#!/bin/sh
set -e

VAULT_CONTAINER="vault"
ENV_FILE="srcs/.env"

echo "Generating ROLE_ID and SECRET_ID..."

for file in srcs/vault/policies/*.hcl; do
  policy=$(basename "$file" .hcl)

  echo " → Generating IDs for $policy"

  ROLE_ID=$(docker exec \
    -e VAULT_ADDR=http://vault:8200 \
    -e VAULT_TOKEN=root \
    $VAULT_CONTAINER \
    vault read -format=json auth/approle/role/$policy/role-id \
    | jq -r '.data.role_id')

  SECRET_ID=$(docker exec \
    -e VAULT_ADDR=http://vault:8200 \
    -e VAULT_TOKEN=root \
    $VAULT_CONTAINER \
    vault write -format=json -f auth/approle/role/$policy/secret-id \
    | jq -r '.data.secret_id')

  echo "$policy: $ROLE_ID / $SECRET_ID"

  grep -q "^VAULT_ROLE_ID_$policy=" "$ENV_FILE" \
    && sed -i "s|^VAULT_ROLE_ID_$policy=.*|VAULT_ROLE_ID_$policy=$ROLE_ID|" "$ENV_FILE" \
    || echo "VAULT_ROLE_ID_$policy=$ROLE_ID" >> "$ENV_FILE"

  grep -q "^VAULT_SECRET_ID_$policy=" "$ENV_FILE" \
    && sed -i "s|^VAULT_SECRET_ID_$policy=.*|VAULT_SECRET_ID_$policy=$SECRET_ID|" "$ENV_FILE" \
    || echo "VAULT_SECRET_ID_$policy=$SECRET_ID" >> "$ENV_FILE"
done



