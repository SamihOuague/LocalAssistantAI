#!/bin/sh

set -e

# Génération des valeurs base64
PRIVATE_B64=$(base64 -w 0 private.pem | tr -d '\n')
PUBLIC_B64=$(base64 -w 0 public.pem | tr -d '\n')
TOTP_B64=$(tr -d '\n' < totp.key)
COOKIE_B64=$(tr -d '\n' < cookie.key)


# Mise à jour du JSON
jq \
  --arg priv "$PRIVATE_B64" \
  --arg pub "$PUBLIC_B64" \
  --arg totp "$TOTP_B64" \
  --arg cookie "$COOKIE_B64" \
  '
  .JWT_PRIVATE_KEY = $priv |
  .JWT_PUBLIC_KEY = $pub |
  .TOTP_ENCRYPTION_KEY = $totp |
  .OAUTH_COOKIE_SECRET = $cookie |
  del(.DATABASE_URL)
  ' \
  srcs/vault/secrets/auth-service.json > srcs/vault/secrets/auth-service.tmp

mv srcs/vault/secrets/auth-service.tmp srcs/vault/secrets/auth-service.json
