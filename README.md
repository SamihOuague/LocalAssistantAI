# 🤖 Local AI Assistant — Documents & Workflow Generator

![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![AI](https://img.shields.io/badge/LLM-Ollama-orange)
![Database](https://img.shields.io/badge/MariaDB-Database-blue)

---

## 📌 Overview

**Local AI Assistant** is a fullstack AI-powered platform designed to run **fully on-premise**, enabling organizations to automate document creation and interact with a private AI system.

It allows users to:
- 💬 Ask questions to a local AI assistant
- 🧠 Get AI-generated responses based on internal context
- 📄 Generate professional documents:
  - Contracts
  - Letters
  - Quotes / Estimates
  - Business templates
- 📥 Export documents as **PDF** and **DOCX**

🔐 *All data is processed locally. No external API calls are required.*

⚠️ *This project is intended for internal use and development purposes.*

---

## 🧠 Core Features

### 💬 AI Assistant
- Real-time AI chat (streaming responses)
- Context-aware responses based on prompts
- Powered by **local LLM (Ollama)**

---

### 📄 Document Generation
Automatically generates structured documents from AI outputs:

- 📑 Markdown generation
- 📄 PDF export (Puppeteer)
- 📝 DOCX export

Supported document types:
- Contracts
- Business letters
- Requests / formal messages
- Quotes and estimates

---

### 🔐 Authentication System
- User registration / login
- Secure session handling
- MariaDB-backed persistence

---

## 🏗️ Architecture

```
User
  ↓ HTTPS
Nginx (Reverse Proxy)
  ├── Frontend (React)
  ├── Auth API (Node.js + Sequelize)
  └── AI API (WebSocket + Ollama)
        ↓
      MariaDB
```

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- TypeScript
- WebSocket client (real-time AI chat)

### Backend
- Node.js
- Express
- WebSocket (`ws`)

### AI Engine
- Ollama (local LLM)
- Streaming responses

### Database
- MariaDB

### Infrastructure
- Docker / Docker Compose
- Nginx (HTTPS reverse proxy)

### Document Generation
- Puppeteer (PDF rendering)
- docx (Word generation)

---

## 🚀 Installation

```bash
git clone <repo-url>
cd srcs
echo "your_db_password" > ../secrets/db_password.txt
docker compose up --build
