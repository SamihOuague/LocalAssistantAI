#!/bin/bash
apt update && apt upgrade -y \
    && apt install -y curl jq
echo "[entrypoint] Waiting for Vault...";
echo $VAULT_ADDR;
until curl -s $VAULT_ADDR/v1/sys/health > /dev/null; do
    sleep 1;
done;

echo "[entrypoint] Authenticating to Vault...";

TOKEN=$(curl -s \
    --request POST \
    --data "{\"role_id\":\"$VAULT_ROLE_ID\", \"secret_id\":\"$VAULT_SECRET_ID\"}" \
$VAULT_ADDR/v1/auth/approle/login | jq -r '.auth.client_token');


if [ -z "$TOKEN" ]; then
    echo "[entrypoint] ERROR: Vault authentication failed";
    exit 1
fi;

echo "[entrypoint] Fetching secrets...";
SECRETS=$(curl -s \
    --header "X-Vault-Token: $TOKEN" \
$VAULT_ADDR/v1/secret/data/elastic-service | jq -r '.data.data');

export ELASTIC_USER=$(echo "$SECRETS" | jq -r '.ELASTIC_USER')
export ELASTIC_PASSWORD=$(echo "$SECRETS" | jq -r '.ELASTIC_PASSWORD')
export KIBANA_PASSWORD=$(echo "$SECRETS" | jq -r '.KIBANA_PASSWORD')
export KIBANA_USERNAME=$(echo "$SECRETS" | jq -r '.KIBANA_USERNAME')
if [ x${ELASTIC_PASSWORD} == x ]; then
    echo "Set the ELASTIC_PASSWORD environment variable in the .env file";
    exit 1;
    elif [ x${KIBANA_PASSWORD} == x ]; then
    echo "Set the KIBANA_PASSWORD environment variable in the .env file";
    exit 1;
fi;
if [ ! -f config/certs/ca.zip ]; then
    echo "Creating CA";
    bin/elasticsearch-certutil ca --silent --pem -out config/certs/ca.zip;
    unzip config/certs/ca.zip -d config/certs;
fi;
if [ ! -f config/certs/certs.zip ]; then
    echo "Creating certs";
    echo -ne \
    "instances:\n"\
    "  - name: es01\n"\
    "    dns:\n"\
    "      - es01\n"\
    "      - localhost\n"\
    "    ip:\n"\
    "      - 127.0.0.1\n"\
    "  - name: kibana\n"\
    "    dns:\n"\
    "      - kibana\n"\
    "      - localhost\n"\
    "    ip:\n"\
    "      - 127.0.0.1\n"\
    > config/certs/instances.yml;
    bin/elasticsearch-certutil cert --silent --pem -out config/certs/certs.zip --in config/certs/instances.yml --ca-cert config/certs/ca/ca.crt --ca-key config/certs/ca/ca.key;
    unzip config/certs/certs.zip -d config/certs;
fi;
echo "Setting file permissions"
chown -R root:root config/certs;
find . -type d -exec chmod 750 \{\} \;;
find . -type f -exec chmod 640 \{\} \;;
echo "Waiting for Elasticsearch availability";
until curl -s --cacert config/certs/ca/ca.crt https://es01:9200 | grep -q "missing authentication credentials"; do sleep 30; done;
echo "Setting ${KIBANA_USERNAME} password";
until curl -s -X POST --cacert config/certs/ca/ca.crt -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" https://es01:9200/_security/user/${KIBANA_USERNAME}/_password -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do sleep 10; done;
echo "All done!";