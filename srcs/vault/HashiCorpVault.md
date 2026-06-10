
# 🔐 HashiCorp Vault — Le guide complet (architecture, policies, AppRole, intégration)

## 🎯 Objectif
Comprendre **exactement** :
- comment Vault stocke et protège les secrets
- comment les microservices s’authentifient
- comment créer des policies
- comment utiliser AppRole
- comment organiser les secrets
- comment gérer la rotation
- comment intégrer Vault dans Docker / Kubernetes
- ce que tu dois dire en soutenance

---

# 🧱 1. Architecture logique de Vault dans le projet

```
Microservices → API Gateway → Vault (port 8200)
                     ↑
                Policies + AppRoles
```

Vault devient **la seule source de vérité** pour :
- DB credentials
- OAuth secrets
- JWT signing keys
- LLM API keys
- Secrets internes (webhooks, tokens internes…)

👉 **Aucun secret ne doit être dans `.env`**
👉 **Aucun secret ne doit être dans Git**
👉 **Aucun secret ne doit être dans Docker**

---

# 🧩 2. Les concepts essentiels de Vault (à connaître absolument)

## ✔️ 2.1. Secrets Engine
Un “moteur” qui stocke ou génère des secrets.

Pour notre projet :
- **KV v2** (Key/Value) → parfait pour API keys, JWT, OAuth
- **Database Engine** (optionnel) → rotation automatique des credentials MariaDB

## ✔️ 2.2. Policies
Définissent **qui peut accéder à quoi**.

Exemple :
- Auth Service → accès aux secrets JWT
- User Service → accès aux secrets DB
- LLM Service → accès aux API keys LLM

## ✔️ 2.3. Auth Methods
Comment un service s’authentifie auprès de Vault.

Pour vous :
👉 **AppRole** (méthode recommandée en production)

## ✔️ 2.4. Tokens
Une fois authentifié, Vault donne un **token temporaire**.

---

# 🔑 3. Organisation des secrets (structure recommandée)

```
secret/
  auth-service/
      JWT_ACCESS_SECRET
      JWT_REFRESH_SECRET

  user-service/
      DB_USER
      DB_PASSWORD

  llm-service/
      OPENAI_API_KEY

  oauth/
      GOOGLE_CLIENT_ID
      GOOGLE_CLIENT_SECRET
      GITHUB_CLIENT_ID
      GITHUB_CLIENT_SECRET
```

👉 **Chaque microservice a son propre namespace**
👉 **Séparation stricte = sécurité + soutenance facile**

---

# 📜 4. Policies Vault (le cœur de la sécurité)

Une policy est un fichier HCL.

### Exemple : policy pour Auth Service
```
path "secret/data/auth-service/*" {
  capabilities = ["read"]
}
```

### Policy pour User Service
```
path "secret/data/user-service/*" {
  capabilities = ["read"]
}
```

### Policy pour LLM Service
```
path "secret/data/llm-service/*" {
  capabilities = ["read"]
}
```

👉 **Chaque service ne peut lire que ses secrets.**

---

# 🧩 5. AppRole — Le mécanisme d’authentification des microservices

AppRole =
- **role_id** → public
- **secret_id** → privé
- **token** → temporaire

### 5.1. Création d’un AppRole
```
vault write auth/approle/role/auth-service \
    policies="auth-service-policy" \
    token_ttl=1h \
    token_max_ttl=4h
```

### 5.2. Récupérer le role_id
```
vault read auth/approle/role/auth-service/role-id
```

### 5.3. Générer un secret_id
```
vault write -f auth/approle/role/auth-service/secret-id
```

---

# 🔄 6. Comment un microservice récupère ses secrets ?

### Étape 1 : Authentification via AppRole
```
POST /v1/auth/approle/login
{
  "role_id": "...",
  "secret_id": "..."
}
```

Vault répond :
```
{
  "auth": {
    "client_token": "s.123456789",
    "lease_duration": 3600
  }
}
```

### Étape 2 : Récupération des secrets
```
GET /v1/secret/data/auth-service
X-Vault-Token: s.123456789
```

---

# 🔁 7. Rotation automatique des secrets (non realiser)

Vault peut :
- régénérer les secrets DB
- invalider les anciens tokens
- renouveler les JWT signing keys
- régénérer les API keys LLM (si provider compatible)

### Exemple : rotation DB
```
vault write database/rotate-root mydb
```

### Exemple : rotation JWT
Vous pouvez :
- stocker plusieurs clés
- utiliser `kid` dans le header JWT
- faire une rotation transparente

---

# 📊 8. Logs Vault (intégration ELK - non realiser)

Vault génère :
- audit logs
- auth logs
- secret access logs

Ces logs peuvent être envoyés dans :
- Logstash
- Elasticsearch
- Kibana

---
