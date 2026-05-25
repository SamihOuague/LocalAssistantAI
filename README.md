# 🤖 Local AI Assistant — Documents & Workflow Generator

![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![AI](https://img.shields.io/badge/LLM-Ollama-orange)
![Database](https://img.shields.io/badge/MariaDB-Database-blue)

---

# 🤖 Local AI Router — Hybrid Local/Cloud AI Orchestration

Docker Node.js React AI RAG Ollama

## 📌 Overview

Local AI Router is a fullstack AI orchestration platform designed to intelligently route user requests to the most appropriate AI model based on prompt complexity, privacy requirements, and cost optimization.

The system dynamically selects between:

* 🖥️ Local lightweight models for simple requests
* 🧠 Local RAG agents for contextual/internal knowledge queries
* ☁️ Cloud models for advanced reasoning and complex tasks

The goal is to:

* reduce token costs,
* maximize local processing,
* improve privacy,
* and maintain high-quality AI responses.

All routing behavior is configurable.

---

## 🧠 Core Features

### 🔀 Intelligent AI Routing

Automatically classifies prompts and routes them to the most appropriate model pipeline.

Example routing strategy:

| Request Type                | Target                |
| --------------------------- | --------------------- |
| Simple prompts              | Local lightweight LLM |
| Contextual/internal queries | Local RAG agent       |
| Complex reasoning           | Cloud fallback model  |

Routing can be customized depending on:

* latency,
* privacy,
* token budget,
* model capabilities,
* hardware constraints.

---

### 💬 Real-Time AI Chat

* Streaming responses
* WebSocket-based communication
* Multi-model support
* Dynamic model switching

---

### 🧠 Local RAG Agent

Supports local Retrieval-Augmented Generation:

* vector search,
* contextual memory,
* internal knowledge bases,
* private document retrieval.

Designed for:

* internal company data,
* local documentation,
* offline/private AI systems.

---

### ☁️ Cloud Fallback Support

Complex prompts can automatically fallback to external cloud models when:

* reasoning exceeds local model capability,
* confidence is low,
* or advanced tools are required.

Optional and fully configurable.

---

### 🔐 Privacy & Cost Optimization

The platform is designed to:

* keep as much data local as possible,
* minimize external API calls,
* reduce token usage,
* provide full control over AI infrastructure.

---

## 🏗️ Architecture

```text
User
  ↓ HTTPS
Nginx (Reverse Proxy)
  ├── Frontend (React)
  ├── Auth API (Node.js + Sequelize)
  └── AI Gateway
        ├── Local Fast LLM (Ollama/vLLM)
        ├── Local RAG Agent
        └── Cloud Fallback Models
                ↓
            Vector DB / MariaDB
```

---

## ⚙️ Tech Stack

### Frontend

* React (Vite)
* TypeScript
* WebSocket client
* Streaming chat UI

### Backend

* Node.js
* Express
* WebSocket (`ws`)
* LangChain

### AI Infrastructure

* Ollama
* vLLM
* Local embedding models
* Hybrid routing middleware

### RAG / Storage

* MariaDB
* Vector database support
* Local embeddings

### Infrastructure

* Docker
* Docker Compose
* Nginx reverse proxy

---

## 🔀 Routing System

The platform uses configurable middleware to classify prompts by complexity.

Example:

```text
Simple   → Small local model
Medium   → Local RAG agent
Complex  → Cloud reasoning model
```

Routing criteria may include:

* message length,
* semantic complexity,
* context requirements,
* tool usage,
* confidence thresholds.

---

## 🎯 Goals

* Reduce cloud AI costs
* Improve privacy
* Use local inference whenever possible
* Maintain high response quality
* Provide flexible AI orchestration
* Support self-hosted AI infrastructure

---

## 🚀 Installation

```bash
git clone <repo-url>
cd srcs

echo "your_db_password" > ../secrets/db_password.txt

docker compose up --build
```

---

## ⚠️ Project Status

This project is intended for:

* self-hosted AI experimentation,
* internal tooling,
* AI infrastructure research,
* hybrid local/cloud orchestration.

Not intended for production-critical environments without additional security and scalability work.

---

## 📌 Future Improvements

* Multi-agent orchestration
* Advanced prompt classification
* Model benchmarking
* Automatic cost-aware routing
* GPU-aware scheduling
* Observability dashboard
* Token usage analytics
* Local fine-tuned routing models
