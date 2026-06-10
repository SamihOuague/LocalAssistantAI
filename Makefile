VAULT_ADDR=http://vault:8200
VAULT_TOKEN=root
VAULT_CONTAINER=vault

DATA_DIR = ${HOME}/data
DB_DIR = $(DATA_DIR)/mariadb

### -----------------------------------------
###  ENSURE .env EXISTS
### -----------------------------------------

init-env:
	@test -f srcs/.env || touch srcs/.env

setup-data-dir:
	mkdir -p $(DB_DIR)

### -----------------------------------------
###  ENABLE APPROLE
### -----------------------------------------

vault-enable-approle:
	@echo "Enabling AppRole auth method..."
	@docker exec -e VAULT_ADDR=$(VAULT_ADDR) -e VAULT_TOKEN=$(VAULT_TOKEN) $(VAULT_CONTAINER) \
		vault auth enable approle || true


### -----------------------------------------
###  LOAD ALL POLICIES
### -----------------------------------------

vault-load-policies:
	@echo "Loading Vault policies..."
	@for file in srcs/vault/policies/*.hcl; do \
		name=$$(basename $$file .hcl); \
		echo " → Loading policy $$name"; \
		docker exec -e VAULT_ADDR=$(VAULT_ADDR) -e VAULT_TOKEN=$(VAULT_TOKEN) $(VAULT_CONTAINER) \
			vault policy write $$name /vault/policies/$$name.hcl; \
	done


### -----------------------------------------
###  ENSURE *.sh EXEC
### -----------------------------------------

ensure-scripts-executable:
	@chmod +x srcs/vault/scripts/*.sh


### -----------------------------------------
###  CREATE APPROLE (EXTERNAL SCRIPT)
### -----------------------------------------

vault-create-approles: ensure-scripts-executable
	@ls
	@./srcs/vault/scripts/create_approle.sh


### -----------------------------------------
###  GENERATE IDS (EXTERNAL SCRIPT)
### -----------------------------------------

vault-generate-ids: ensure-scripts-executable init-env setup-data-dir
	@./srcs/vault/scripts/generate_ids.sh


### -----------------------------------------
###  LOAD SECRETS (EXTERNAL SCRIPT)
### -----------------------------------------

vault-load-secrets: ensure-scripts-executable
	@./srcs/vault/scripts/load_secrets.sh

setup-volumes:
	@echo "Creating data directories in $(DATA_DIR)"
	@mkdir -p \
		$(DATA_DIR)/certs \
		$(DATA_DIR)/es01 \
		$(DATA_DIR)/filebeat_logs \
		$(DATA_DIR)/mariadb \
		$(DATA_DIR)/ollama \
		$(DATA_DIR)/kibana
	@ls -l $(DATA_DIR)
### -----------------------------------------
###  FULL SETUP PIPELINE
### -----------------------------------------

full-setup:
	docker compose -f srcs/compose.yml down -v
	@echo "Starting Vault + AppRole + Secrets setup..."
	docker compose -f srcs/compose.yml up -d ollama vault
	sleep 3
	$(MAKE) vault-enable-approle
	$(MAKE) vault-load-policies
	$(MAKE) vault-create-approles
	$(MAKE) vault-generate-ids
	$(MAKE) vault-load-secrets
	docker compose -f srcs/compose.yml exec -it ollama ollama pull embeddinggemma
	docker compose -f srcs/compose.yml exec -it ollama ollama pull llama3.1
	docker compose -f srcs/compose.yml up -d --build --remove-orphans
	@echo "✔ Vault + AppRole + Secrets fully configured."

down:
	@docker compose -f srcs/compose.yml down -v

ps:
	@docker compose -f srcs/compose.yml ps