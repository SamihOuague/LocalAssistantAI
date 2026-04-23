# ⚖️ Legal AI Assistant — Contracts & Document Generator

![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![AI](https://img.shields.io/badge/LLM-Ollama-orange)
![Database](https://img.shields.io/badge/MariaDB-Database-blue)

---

## 📌 Overview

**Legal AI Assistant** is a fullstack AI-powered platform that provides **legal guidance and automated document generation**.

It allows users to:
- 💬 Ask legal questions (contracts, rights, procedures, etc.)
- ⚖️ Receive AI-generated legal advice (LLM-based)
- 📄 Generate professional documents:
  - Contracts
  - Letters
  - Quotes / Estimates
  - Legal templates
- 📥 Export documents as **PDF** and **DOCX**

⚠️ *This project is for educational purposes and does not replace professional legal advice.*

---

## 🧠 Core Features

### 💬 Legal AI Assistant
- Real-time AI chat (streaming responses)
- Context-aware legal explanations
- Powered by **Ollama LLM**

---

### 📄 Document Generation
Automatically generates structured documents from AI responses:

- 📑 Markdown generation
- 📄 PDF export (Puppeteer)
- 📝 DOCX export

Supported document types:
- Contracts
- Legal letters
- Requests / claims
- Quotes and estimates

---

### 🔐 Authentication System
- User registration / login
- Secure session handling
- MariaDB-backed persistence

---

## 🏗️ Architecture
User
↓ HTTPS
Nginx (Reverse Proxy)
├── Frontend (React)
├── Auth API (Node.js + Sequelize)
└── Legal LLM API (WebSocket + Ollama)
↓
MariaDB


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
```
