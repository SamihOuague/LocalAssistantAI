# README
*This project was created as part of the 42 curriculum by&#x20;****souaguen, lsouc, odcoutie, and mtraore****.*

# Self-Hosted AI Assistant

## Description

Self-Hosted AI Assistant is an LLM platform integrating a Retrieval-Augmented Generation (RAG) system.

The goal of this project is to index the project's documentation into a vector database in order to reduce hallucinations and provide contextual assistance during evaluations. Users can ask questions about the project and receive relevant, grounded answers based on the indexed documentation.

### Key Features

* &#x20;Create and delete conversations 
* &#x20;Interact with a self-hosted LLM 
* &#x20;Create an account and manage your profile 
* &#x20;Responsive user interface 

***

## Installation

### Prerequisites

* &#x20;Docker / Docker Compose 
* `curl`
* `jq`

### Environment Setup

Create a `.env` file at the root of the project:

```
# Version of Elastic products
STACK_VERSION=8.7.1

# Cluster name
CLUSTER_NAME=docker-cluster

# Set to 'basic' or 'trial' to automatically start the 30-day trial
LICENSE=basic
# LICENSE=trial

OLLAMA_URL=http://ollama:11434
VLLM_URL=
OPENAI_URL=

VAULT_ADDR=http://vault:8200
OAUTH_42_REDIRECT_URI=/

FRONTEND_URL=https://ft_transcendence
ALLOWED_ORIGINS=https://ft_transcendence,https://api.ft_transcendence

# Memory limits (bytes)
ES_MEM_LIMIT=1073741824
KB_MEM_LIMIT=1073741824
LS_MEM_LIMIT=1073741824
```

***

## Vault Secrets Configuration

Create the following files in `srcs/vault/secrets`:

```
vault/secrets/
├── auth-service.json
├── chatllm-service.json
├── elastic-service.json
└── mariadb-service.json
```

### auth-service.json

```
{
 "DATABASE_URL": "REPLACE_WITH_DATABASE_URL",
 "JWT_PRIVATE_KEY": "REPLACE_WITH_JWT_PRIVATE_KEY",
 "JWT_PUBLIC_KEY": "REPLACE_WITH_JWT_PUBLIC_KEY",
 "TOTP_ENCRYPTION_KEY": "REPLACE_WITH_TOTP_ENCRYPTION_KEY",
 "OAUTH_COOKIE_SECRET": "REPLACE_WITH_OAUTH_COOKIE_SECRET",
 "OAUTH_42_CLIENT_ID": "REPLACE_WITH_OAUTH_42_CLIENT_ID",
 "OAUTH_42_CLIENT_SECRET": "REPLACE_WITH_OAUTH_42_CLIENT_SECRET"
}
```

### chatllm-service.json

```
{
 "OPENAI_API_KEY": "your_api_key",
 "REDIS_PASSWORD": "foobar"
}
```

### elastic-service.json

```
{
 "ELASTIC_USER": "elastic",
 "ELASTIC_PASSWORD": "changeme",
 "KIBANA_USERNAME": "kibana_system",
 "KIBANA_PASSWORD": "changeme"
}
```

### mariadb-service.json

```
{
 "DB_NAME": "ft_transcendence",
 "DB_USER": "your_db_user",
 "DB_PASSWORD": "your_db_password",
 "DB_HOST": "mariadb",
 "DB_DIALECT": "mariadb"
}
```

***

## Resources

### References

* &#x20;Elasticsearch documentation (vector search, kNN, mappings) 
* &#x20;BullMQ documentation 
* &#x20;Ollama and vLLM documentation 
* &#x20;Zod documentation 
* &#x20;LangChain documentation 

### AI Usage

AI tools were used for:

* &#x20;Discussing architecture and technology choices 
* &#x20;Assisting with debugging and error analysis 
* &#x20;Reviewing code and suggesting improvements 
* &#x20;Writing and improving documentation 

***

## Team Information

| Member   | Role(s)                       | Responsibilities                                                          |
| -------- | ----------------------------- | ------------------------------------------------------------------------- |
| souaguen | DevOps / Full-Stack Developer | Architecture, observability, deployment, task distribution, core features |
| lsouc    | Full-Stack Developer          | Authentication backend, OAuth, 2FA, frontend integration                  |
| odcoutie | Frontend Developer            | Frontend development, responsive design, privacy policy                   |
| mtraore  | Cybersecurity Engineer        | Vault integration, deployment scripts, web application firewall           |

***

## Project Management

### Task Distribution

Each team member selected modules according to their interests. We chose the "Backend as a Service" architecture to allow team members to use technologies independently within their services. Every member was responsible for at least one microservice.

### Tools

* &#x20;Git 
* &#x20;Affine 
* &#x20;VS Code 
* &#x20;Firefox / Chrome 
* &#x20;AI assistants 

### Communication

* &#x20;Private Discord server 

***

# Technical Stack

## Backend

### NGINX Reverse Proxy

**Justification**

Since we adopted a microservices architecture, a reverse proxy provides a centralized entry point for all services and enables routing through dedicated subdomains (e.g. `api.ft_transcendence`, `kibana.ft_transcendence`).

***

## LLM / AI Layer

### Ollama / vLLM

**Justification**

Self-hosted LLMs may not always match the performance of cloud-hosted models, but they provide sufficient quality for everyday usage while reducing costs and dependency on external providers.

***

## Databases & Search

### Elasticsearch & MariaDB

**Justification**

Elasticsearch was selected for its full-text search capabilities and native support for vector similarity search, making it suitable for both RAG retrieval and observability workloads.

MariaDB stores transactional application data such as users and conversations.

***

## Queueing & Messaging

* &#x20;Redis 
* &#x20;BullMQ 
* &#x20;Redis Pub/Sub 

**Purpose**

* &#x20;GPU workload management 
* &#x20;LLM request queueing 
* &#x20;Real-time response streaming 

***

## Additional Technologies

* &#x20;Vault 
* &#x20;Zod 
* &#x20;Docker 
* &#x20;NGINX 

***

# Database Structure

## Elasticsearch

### documents

| Field     | Type          | Description                                   |
| --------- | ------------- | --------------------------------------------- |
| id        | keyword       | Document chunk identifier                     |
| content   | text          | Raw document chunk                            |
| embedding | dense\_vector | Vector representation                         |
| source    | keyword       | Source document                               |
| metadata  | object        | Additional metadata (title, tags, date, etc.) |

***

## MariaDB

### chat\_box

| Field  | Type    | Description           |
| ------ | ------- | --------------------- |
| id     | INTEGER | Chat identifier       |
| idUser | TEXT    | Owner user identifier |
| title  | TEXT    | Conversation title    |

### chat\_message

| Field     | Type    | Description                                  |
| --------- | ------- | -------------------------------------------- |
| id        | INTEGER | Message identifier                           |
| role      | TEXT    | Message role (`user`, `assistant`, `system`) |
| content   | TEXT    | Message content                              |
| thinking  | TEXT    | Model reasoning/thinking output (optional)   |
| ChatBoxId | INTEGER | Associated conversation                      |

### Relationships

```
chat_box
└── hasMany(chat_message)

chat_message
└── belongsTo(chat_box)
```

***

# Modules

| Module                                      | Type  | Points | Contributor(s)  |
| ------------------------------------------- | ----- | ------ | --------------- |
| Framework for frontend and backend          | Major | 2      | odcoutie, team  |
| Public API                                  | Major | 2      | souaguen        |
| Standard user management and authentication | Major | 2      | lsouc           |
| Backend as microservices                    | Major | 2      | Team            |
| Complete LLM system interface               | Major | 2      | souaguen        |
| Complete RAG system                         | Major | 2      | souaguen        |
| ELK log management infrastructure           | Major | 2      | souaguen        |
| WAF / ModSecurity + Vault                   | Major | 2      | mtraore         |
| ORM integration                             | Minor | 1      | lsouc, souaguen |
| Additional browser support                  | Minor | 1      | odcoutie        |
| OAuth 2.0 authentication                    | Minor | 1      | lsouc           |
| Complete 2FA system                         | Minor | 1      | lsouc           |
| Custom semantic router                      | Minor | 1      | souaguen        |

**Total: 20 points**

***

# Module Details

## Backend as Microservices

Each functional domain runs as an independent containerized service communicating through an internal Docker network.

**Services**

* &#x20;auth 
* &#x20;chatllm 
* &#x20;mariadb 
* &#x20;elasticsearch 
* &#x20;redis 
* &#x20;vault 
* &#x20;nginx 
* &#x20;elk stack 

***

## Complete LLM System Interface

Provides a complete conversational interface powered by locally hosted LLMs.

The `chatllm` service uses LangChain to route requests toward Ollama or cloud-hosted models when required. BullMQ manages concurrent GPU workloads.

***

## Complete RAG System

Documents are chunked, embedded, and indexed into Elasticsearch.

User queries trigger similarity searches whose results are injected into the prompt context before LLM generation.

***

## ELK Log Management Infrastructure

Filebeat and Metricbeat collect logs and metrics from all services.

Logstash processes incoming data, Elasticsearch stores it, and Kibana provides dashboards and visualization.

***

## WAF / ModSecurity + Vault

ModSecurity protects the platform against common web attacks such as:

* &#x20;SQL Injection 
* &#x20;Cross-Site Scripting (XSS) 
* &#x20;Path Traversal 

Vault centralizes secret management and distributes credentials securely to services using AppRole authentication.

***

## Custom Semantic Router

A lightweight semantic classifier that routes incoming requests according to their complexity (simple, medium, or complex).

***

## Standard User Management & Authentication

Features:

* &#x20;User registration 
* &#x20;User login 
* &#x20;JWT authentication 
* &#x20;Session management 
* &#x20;User profile management 

***

## OAuth 2.0 & 2FA

* &#x20;OAuth authentication through the 42 Intranet 
* &#x20;Time-based One-Time Password (TOTP) support 

***

## Additional Browser Support

The application has been tested and adapted for:

* &#x20;Chrome 
* &#x20;Firefox 
* &#x20;Safari 

***

## ORM Integration

Database access is abstracted through an ORM layer using Sequelize or Prisma.

***

## System Architecture Overview

![Diagram overview](diagram_overview.png)

***

# License

This project was developed for educational purposes as part of the 42 curriculum.