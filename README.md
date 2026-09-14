# 🤖 AI QA Agent Platform

> **Autonomous Knowledge-Driven Test Automation powered by Google Drive Knowledge Ingestion & Playwright**

---

## 🌟 Overview (প্রজেক্ট ওভারভিউ)

**AI QA Agent Platform** হলো একটি পার্সোনাল অটোনোমাস **AI QA ইঞ্জিনিয়ারিং সিস্টেম**। এখানে ব্যবহারকারীকে কোনো ম্যানুয়াল টেস্ট কেস লিখতে হয় না। 

গুগল ড্রাইভে সংরক্ষিত QA নলেজ (যেমন: **Boundary Value Analysis**, **Equivalence Partitioning**, **Project Requirements Specifications**, এবং **Historical Defect Logs**) স্বয়ংক্রিয়ভাবে RAG/MCP ইনডেক্সিংয়ের মাধ্যমে রিট্রিভ করে এজেন্ট নিজেই রিয়েল-ওয়ার্ল্ড টেস্ট মেট্রিক্স তৈরি করে এবং **Playwright** ব্রাউজার দিয়ে রিয়েল-টাইম টেস্ট এক্সিকিউট করে।

---

## 🏗️ System Architecture (সিস্টেম আর্কিটেকচার)

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

## 🚀 Key Features (মূল বৈশিষ্ট্যসমূহ)

### 1. 📂 Google Drive & PDF Knowledge Base Indexer
- **QA Fundamentals**: Functional Testing, Smoke & Regression Testing গাইডলাইন।
- **Test Techniques**:
  - **Boundary Value Analysis (BVA)**: কোনো ইনপুট রেঞ্জ `[1, 10]` হলে স্বয়ংক্রিয়ভাবে `0, 1, 2, 9, 10, 11` বাউন্ডারি ভ্যালু ডিটেকশন।
  - **Equivalence Partitioning (EP)**: ভ্যালিড ও ইনভ্যালিড পার্টিশন টেস্ট।
- **Project Documents**: Checkout Requirements v2.4 (দাম, কুপন রুল, কার্ড ভ্যালিডেশন)।
- **Bug Knowledge**: অতীতের ডিফেক্ট হিস্টোরি (যেমন `#BUG-104` শূন্য কোয়ান্টিটি চেকআউট বাগ)।

### 2. 🧠 Autonomous QA Reasoning Brain
- ব্যবহারকারী শুধু লিখবে: **“Test the checkout feature quantity validation”**
- এজেন্ট নিজেই ডিসিশন নেবে:
  - বাউন্ডারি ভ্যালু অ্যানালাইসিস প্রয়োগ করা।
  - অতীতের ডিফেক্ট `#BUG-104` এর জন্য রিগ্রেশন চেক করা।
  - কোনো ম্যানুয়াল টেস্ট স্ক্রিপ্ট ছাড়া **৮টি টেস্ট সিনারিও** তৈরি করা।

### 3. 🎭 Playwright Automation Engine
- স্বয়ংক্রিয়ভাবে হেডলেস Chromium ব্রাউজার চালু করে রিয়েল DOM ইন্টারেকশন করে।
- প্রতিটি টেস্ট স্টেপের জন্য **লাইভ স্ক্রিনশট** (`public/screenshots/`) ক্যাপচার করে।
- DOM রেসপন্স, ভ্যালিডেশন মেসেজ এবং টাইম পারফরম্যান্স লগ সংরক্ষণ করে।

### 4. 🛒 Embedded E-Commerce Sandbox Application
- সিস্টেমে একটি রিয়েল টার্গেট ই-কমার্স চেকআউট ওয়েব অ্যাপ সংযুক্ত (`http://localhost:3000/sandbox`)।
- যাতে কোয়ান্টিটি লিমিট (১–১০), কুপন কোড (`SAVE10`), এবং ক্রেডিট কার্ড ভ্যালিডেশন রুলস সরাসরি লাইভ টেস্ট করা যায়।

### 5. 🌓 100% Full Viewport Dual Theme (Dark & White Mode)
- **🌙 Deep Obsidian Dark Mode (`#0a0d14`)**: গ্লাস-প্যানেল ও নিওন অ্যাকসেন্ট।
- **☀️ Crisp Clean White Mode (`#f8fafc` / `#ffffff`)**: হাই-কনট্রাস্ট লাইট থিম।
- হেডার নেভিগেশন বারে ওয়ান-ক্লিক **Sun / Moon** থিম সুইচ বাটন।

---

## 📁 Project Directory Structure (ফাইল স্ট্রাকচার)

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
│   ├── knowledge-indexer.js            # RAG / Document indexing engine
│   ├── qa-agent-brain.js               # AI QA Reasoning & test matrix synthesis
│   ├── playwright-runner.js            # Automated Playwright test executor
│   ├── sandbox-app.js                  # Target E-Commerce checkout application
│   └── server.js                       # Express API & WebSocket streaming server
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
├── package.json                        # Project dependencies
├── tailwind.config.js                  # Tailwind configuration (darkMode: 'class')
└── vite.config.js                      # Vite bundler configuration
```

---

## 🛠️ Getting Started (কীভাবে রান করবেন)

### ১. ডিপেন্ডেন্সি ইনস্টল করুন:
```bash
npm install
npx playwright install chromium
```

### ২. সার্ভার ও ড্যাশবোর্ড চালু করুন:

```bash
# ব্যাকএন্ড সার্ভার চালু করতে:
node server/server.js

# অথবা কনকারেন্টলি ফ্রন্টএন্ড ও ব্যাকএন্ড রান করতে:
npm run dev
```

---

## 🌐 Live URLs & Endpoints

| সার্ভিস | URL | বর্ণনা |
| :--- | :--- | :--- |
| **AI QA Dashboard UI** | `http://localhost:5173` | মেইন ড্যাশবোর্ড (কমান্ড সেন্টার ও নলেজ ড্রাইভ) |
| **Target Sandbox App** | `http://localhost:3000/sandbox` | রিয়েল চেকআউট টার্গেট অ্যাপ |
| **Backend & Knowledge API** | `http://localhost:3000` | নলেজ সার্চ ও প্লে-রাইট টেস্ট সার্ভিস |

---

## 📝 Example Prompts to Try:

1. `Test the checkout feature quantity validation using Boundary Value Analysis`
2. `Test promo code validation using Equivalence Partitioning`
3. `Perform regression test against historical checkout defects`
4. `Test checkout button behavior on invalid inputs`
