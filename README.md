# 🤖 Autonomous AI QA Agent Platform

> **Autonomous, Knowledge-Driven Test Automation powered by Google Drive / PDF Knowledge Ingestion & Playwright**

---

## 🌟 Overview

The **Autonomous AI QA Agent Platform** is a personal AI-driven QA engineering system designed to eliminate manual test case writing. 

Instead of writing repetitive test cases, users store their testing documents in a Google Drive repository (or local folder)—including **Boundary Value Analysis (BVA)** guidelines, **Equivalence Partitioning (EP)** techniques, **Project Requirement Specifications**, and **Historical Defect Databases**.

When you instruct the agent with a single prompt like:
> **“Test the checkout feature quantity validation”**

The Agent dynamically retrieves testing heuristics and project rules via RAG/MCP search, synthesizes executable test scenarios, and autonomously drives a **Playwright Chromium** browser session with real-time screenshot captures and pass/fail reports.

---

## 🏗️ System Architecture

```text
                 ┌──────────────────────────────────────┐
                 │             Google Drive             │
                 │          QA Knowledge Docs           │
                 │                                      │
                 │ • QA Fundamentals (Functional, Smoke)│
                 │ • Test Techniques (BVA, Partitioning)│
                 │ • Project Specs & Business Rules     │
                 │ • Historical Defects & Bug Database  │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │       QA Knowledge Indexer (RAG)     │
                 │       Fuzzy Search & MCP Bridge      │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │             AI QA AGENT              │
                 │                                      │
                 │  1. Feature Intent Understanding     │
                 │  2. Heuristic Retrieval (BVA Rules)  │
                 │  3. Test Matrix Synthesis            │
                 │  4. Playwright Command Generation    │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │       Playwright Browser Engine      │
                 │   (Live Execution + Screenshots)     │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │      Target Application Sandbox      │
                 │       (E-Commerce Checkout)          │
                 └──────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 📂 Google Drive & PDF Knowledge Base Indexer
- **QA Fundamentals**: Functional Testing, Smoke & Sanity, and Regression Testing guidelines.
- **Test Techniques**:
  - **Boundary Value Analysis (BVA)**: Automatically computes boundary inputs `[0, 1, 2, MAX-1, MAX, MAX+1]` for any numeric range constraints (e.g., Quantity 1–10 → 0, 1, 2, 9, 10, 11).
  - **Equivalence Partitioning (EP)**: Separates inputs into valid and invalid partitions (e.g. promo codes, email formats).
- **Project Documents**: E-Commerce Checkout Requirements v2.4 (item pricing, promo discounts, credit card validation rules).
- **Bug Knowledge**: Historical Defect Database (`#BUG-104` zero-quantity order glitch, `#BUG-219` negative quantity balance bug).

### 2. 🧠 Autonomous QA Reasoning Brain
- Given a high-level command like *"Test the checkout feature"*, the agent:
  - Determines which testing techniques apply (BVA for numeric bounds, EP for discount codes).
  - Cross-references requirements and historical defect vectors.
  - Automatically synthesizes **8 comprehensive test scenarios** without requiring manually written test scripts.

### 3. 🎭 Playwright Automation Engine
- Launches a headless/headful Chromium browser instance.
- Performs real DOM actions (`fill`, `click`, `select`).
- Evaluates error banners, computed prices, and state changes.
- Captures step-by-step screenshots in `public/screenshots/` and streams live progress over WebSockets.

### 4. 🛒 Embedded E-Commerce Sandbox Application
- Includes a built-in target checkout application running at `http://localhost:3000/sandbox`.
- Supports realistic user flows: quantity restrictions (1–10), coupon codes (`SAVE10`, `FREESHIP`), card number & CVC checks, and live order confirmation alerts.

### 5. 🌓 100% Full Viewport Dual Theme (Dark & White Mode)
- **🌙 Deep Obsidian Dark Mode (`#0a0d14`)**: Glassmorphism cards with glowing neon accents.
- **☀️ Crisp Clean White Mode (`#f8fafc` / `#ffffff`)**: High-contrast, pristine light UI.
- One-click **Sun / Moon** toggle button located in the top navigation bar with persistent `localStorage` support.

---

## 📁 Project Directory Structure

```text
QA-Drive/
├── QA-Knowledge/                       # Google Drive QA Knowledge Documents
│   ├── QA Fundamentals/
│   │   └── Functional Testing.md
│   ├── Test Techniques/
│   │   ├── Boundary Value Analysis.md
│   │   └── Equivalence Partitioning.md
│   ├── Project Documents/
│   │   └── Checkout Requirements.md
│   └── Bug Knowledge/
│       └── Historical Defects.md
│
├── server/                             # Backend & Playwright Execution Services
│   ├── knowledge-indexer.js            # Document parser & RAG search engine
│   ├── qa-agent-brain.js               # AI QA Reasoning & scenario synthesizer
│   ├── playwright-runner.js            # Automated Playwright browser runner
│   ├── sandbox-app.js                  # Target E-Commerce checkout application
│   └── server.js                       # Express REST API & WebSocket server
│
├── src/                                # Frontend UI Dashboard (React + Tailwind)
│   ├── components/
│   │   ├── Header.jsx                  # Top navigation & theme toggle
│   │   ├── AgentCommandCenter.jsx      # AI Agent prompt console & test matrix
│   │   ├── KnowledgeExplorer.jsx       # Google Drive document viewer & search
│   │   ├── ExecutionMonitor.jsx        # Live Playwright test results & screenshots
│   │   └── SandboxPreview.jsx          # Target application embedded preview
│   ├── App.jsx                         # Main dashboard layout & WS state
│   └── index.css                       # Tailwind & theme glassmorphism tokens
│
├── public/screenshots/                 # Live Playwright capture screenshots
├── package.json                        # Project dependencies & scripts
├── tailwind.config.js                  # Tailwind configuration (darkMode: 'class')
└── vite.config.js                      # Vite bundler configuration
```

---

## 🛠️ Installation & Setup

### 1. Install Dependencies:
```bash
npm install
npx playwright install chromium
```

### 2. Start the Backend & Dashboard:

```bash
# Start the Backend Server (Express + WebSockets + Knowledge API + Sandbox):
node server/server.js

# In a separate terminal, start the Vite Dev Server:
npm run dev
```

---

## 🌐 Live URLs & Ports

| Service | URL | Description |
| :--- | :--- | :--- |
| **AI QA Dashboard UI** | `http://localhost:5173` | Main dashboard (Command Center & Knowledge Explorer) |
| **Target Sandbox App** | `http://localhost:3000/sandbox` | Live E-Commerce Checkout application under test |
| **Backend & Knowledge API** | `http://localhost:3000` | REST API, WebSocket streams, and static screenshots |

---

## 💡 Example Prompts to Test

- `Test the checkout feature quantity validation using Boundary Value Analysis`
- `Test promo code validation using Equivalence Partitioning`
- `Perform regression test against historical checkout defects`
- `Test checkout button behavior on invalid inputs`

---

## 📄 License

MIT License © 2026 AI QA Agent Platform.
