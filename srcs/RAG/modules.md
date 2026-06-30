# Modules & Technologies

## Major Modules (2 pts chacun)

### Framework frontend et backend
**Points : 2 — Contributeurs : odcoutie, team**

Le frontend est développé avec un framework JavaScript moderne (React) et le backend expose des API REST via Express (Node.js). Les deux services communiquent via un réseau Docker interne, avec NGINX comme point d'entrée unique.

---

### API publique
**Points : 2 — Contributeur : souaguen**

Les services `auth` et `chatllm` exposent chacun une spécification OpenAPI 3.0.3. Les deux specs sont agrégées dans un `swagger.json` unique monté via volume Docker et consultable via Swagger UI. La validation des entrées est assurée par Zod v3.

---

### Gestion utilisateurs et authentification
**Points : 2 — Contributeur : lsouc**

Système complet de gestion des utilisateurs : inscription, connexion, gestion de profil, sessions. L'authentification repose sur des JWT (clés RSA privée/publique). Les tokens sont vérifiés à chaque requête sur les routes protégées.

---

### Backend en microservices
**Points : 2 — Contributeur : team**

Chaque domaine fonctionnel tourne comme un conteneur indépendant. Les services communiquent via le réseau interne Docker sans exposition directe. NGINX route les requêtes vers le bon service selon le sous-domaine (`api.ft_transcendence`, `kibana.ft_transcendence`, etc.).

| Service       | Rôle                                            |
|---------------|-------------------------------------------------|
| nginx         | Reverse proxy, WAF, terminaison TLS             |
| auth          | Authentification, JWT, OAuth, TOTP              |
| chatllm       | Orchestration LLM, RAG, routing sémantique      |
| mariadb       | Base de données relationnelle                   |
| elasticsearch | Recherche vectorielle + stockage logs           |
| redis         | Queue BullMQ + Pub/Sub streaming                |
| vault         | Gestion des secrets                             |
| kibana        | Dashboards observabilité                        |
| logstash      | Pipeline de traitement des logs                 |
| filebeat      | Collecte des logs applicatifs                   |
| metricbeat    | Collecte des métriques système                  |

---

### Interface LLM complète
**Points : 2 — Contributeur : souaguen**

Interface conversationnelle complète pilotée par LangChain. Les requêtes sont mises en file via **BullMQ** (Redis) pour gérer la concurrence GPU. Le streaming des tokens vers le client passe par **Redis Pub/Sub** : un channel nommé par hash SHA-256 d'un nonce unique est créé par requête, avec un protocole READY/START entre le dispatcher et le worker pour synchroniser le début du stream.

Providers supportés :
- **Ollama** — inférence locale, modèles auto-hébergés
- **Google Gemini** — provider cloud pour les requêtes complexes
- **OpenAI** — provider cloud optionnel

---

### Système RAG complet
**Points : 2 — Contributeur : souaguen**

Pipeline Retrieval-Augmented Generation en deux phases :

**Ingestion (offline)**
La documentation du projet est découpée en chunks, convertie en vecteurs via un modèle d'embedding local, puis indexée dans Elasticsearch (index `chatllm_rag`) avec un mapping `dense_vector` pour la recherche kNN.

**Requête (online)**
La query utilisateur est embedée, une recherche kNN est lancée dans l'index, les top-k chunks pertinents sont injectés dans le prompt system avant la génération LLM. Cela ancre les réponses dans la documentation réelle du projet et réduit les hallucinations.

---

### Infrastructure ELK
**Points : 2 — Contributeur : souaguen**

Stack complète d'observabilité :
- **Filebeat** collecte les logs applicatifs de tous les conteneurs
- **Metricbeat** collecte les métriques système (CPU, RAM, réseau)
- **Logstash** traite et normalise les données (pipeline `filebeat → logstash → elasticsearch`)
- **Elasticsearch** stocke les logs et métriques
- **Kibana** expose les dashboards de visualisation

---

### WAF ModSecurity + Vault
**Points : 2 — Contributeur : mtraore**

**ModSecurity** est intégré à NGINX comme Web Application Firewall. Il protège la plateforme contre les attaques courantes : SQL Injection, XSS, Path Traversal, via le ruleset OWASP CRS.

**HashiCorp Vault** centralise la gestion des secrets. Chaque service s'authentifie via AppRole (role_id + secret_id) et récupère uniquement ses propres credentials au démarrage. Aucune credential n'est stockée en clair dans les images Docker ou les variables d'environnement.

---

## Minor Modules (1 pt chacun)

### ORM Sequelize
**Points : 1 — Contributeurs : lsouc, souaguen**

L'accès à MariaDB est abstrait via **Sequelize**. Les modèles `chat_box` et `chat_message` sont définis par code avec leur relation `hasMany` / `belongsTo` et suppression en cascade (`onDelete: CASCADE`).

---

### Support multi-navigateurs
**Points : 1 — Contributeur : odcoutie**

L'application a été testée et adaptée pour Chrome, Firefox et Safari.

---

### OAuth 2.0 (42 Intranet)
**Points : 1 — Contributeur : lsouc**

Authentification OAuth 2.0 via l'Intranet 42. L'utilisateur peut se connecter avec son compte 42 sans créer de mot de passe local. Le flow d'autorisation standard (redirect → code → token → profil) est implémenté côté backend.

---

### 2FA TOTP
**Points : 1 — Contributeur : lsouc**

Authentification à deux facteurs basée sur des mots de passe temporels (TOTP — RFC 6238). Compatible avec les applications d'authentification standard (Google Authenticator, Authy). La clé secrète TOTP est chiffrée avant stockage.

---

### Routeur sémantique custom
**Points : 1 — Contributeur : souaguen**

Middleware `dynamicModelSelection` qui classifie chaque requête selon sa complexité avant de la router vers le modèle adapté.

| Complexité | Modèle cible                  | Critères                                  |
|------------|-------------------------------|-------------------------------------------|
| Simple     | Ollama local (petit modèle)   | Questions factuelles, mots-clés directs   |
| Medium     | Ollama local / cloud léger    | Raisonnement modéré, contexte intermédiaire |
| Complex    | Google Gemini                 | Raisonnement avancé, chaîne longue        |

---

## Total : 22 points
9 Major × 2 + 4 Minor × 1
