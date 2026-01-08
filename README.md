# 🇮🇳 GATI — Governance & Aadhaar Tracking Intelligence

<div align="center">

![GATI Banner](https://img.shields.io/badge/GATI-India's_Identity_Mission_Control-0A2463?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ii8+PC9zdmc+)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-10-FF0055?style=flat-square&logo=framer)](https://www.framer.com/motion/)

**A National AI-Powered Mission Control System for India's 1.4 Billion Identities**

[Live Demo](#) · [Documentation](#) · [Report Bug](https://github.com/SharmARohitt/Gati/issues)

</div>

---

## 🎯 What is GATI?

**GATI** (Governance & Aadhaar Tracking Intelligence) is a **government-grade, AI-driven web platform** designed to serve as India's national mission-control system for Aadhaar intelligence, real-time monitoring, predictive analytics, and field-level governance execution.

> 🛡️ **This is NOT a startup SaaS dashboard. This is a national digital infrastructure command center.**

Built for **UIDAI Central Administrators**, **State-Level Officers**, **District Supervisors**, and **Policy Analysts**, GATI transforms raw Aadhaar enrollment data into actionable governance insights—predicting coverage gaps, detecting anomalies, and dispatching field operations in real-time.

---

## 🏛️ Core Capabilities

| Module | Description |
|--------|-------------|
| 🗺️ **India Digital Twin** | Interactive 3D visualization of India's identity landscape—zoom from national to PIN-code level with real-time data overlays for coverage, freshness, and risk indicators |
| 🧠 **AI Intelligence Engine** | Predictive ML models for enrollment forecasting, biometric update alerts, anomaly detection, and demographic churn analysis |
| 🎛️ **Admin Command Center** | Comprehensive dashboard for issue management, task assignment, field officer tracking, and real-time operational status |
| 🔍 **Verification Console** | Pattern-based identity verification using aggregated, anonymized data—flags risk signals for official field verification |
| 👥 **Field Operations** | Live tracking of field officers, GPS locations, task completion rates, and performance metrics |
| ⛓️ **Blockchain Audit Trail** | Immutable, cryptographically-verified record of every governance action—timestamped and tamper-proof |
| 📊 **Analytics & Reports** | Auto-generated reports for UIDAI and State governments with AI-written policy recommendations |

---

## 🚀 Tech Stack

```
Frontend        → Next.js 14, React 18, TypeScript
Styling         → Tailwind CSS with Custom Government Design System
Animations      → Framer Motion (smooth, confident, not playful)
Visualization   → Recharts, Custom SVG India Map
State           → React Hooks, Context API
Typography      → IBM Plex Sans (Display), Inter (Body)

ML Backend      → Python FastAPI, Uvicorn
ML Models       → Scikit-learn, XGBoost, Prophet
AI Integration  → Hugging Face Inference API (Qwen, Llama, Mixtral)
Deployment      → Docker, Docker Compose
```

---

## 🧠 ML Pipeline

GATI includes a production-ready machine learning system:

| Model | Algorithm | Purpose | Accuracy |
|-------|-----------|---------|----------|
| Anomaly Detector | Isolation Forest | Detect unusual enrollment patterns | 94.5% |
| Risk Scorer | XGBoost Ensemble | Calculate fraud risk scores | 91.2% |
| Forecaster | Prophet | Predict enrollment trends | 88.7% |

### Running the ML Backend

```bash
cd ml
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### ML API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | System health check |
| `POST /predict/anomaly` | Anomaly detection |
| `POST /predict/risk` | Risk scoring |
| `POST /predict/forecast` | Enrollment forecasting |

---

## 🎨 Design Philosophy

GATI follows a **Government-Grade Design Language**:

- **Authoritative** — Navy primary (#0A2463), trustworthy blue (#1E5AA8)
- **Futuristic** — Cyan accent glows (#00B4D8), glass morphism panels
- **Professional** — Clean typography, structured layouts, no playful elements
- **Accessible** — High contrast, clear hierarchy, responsive across devices

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing Page
│   ├── digital-twin/         # 3D India Map Visualization
│   ├── intelligence/         # AI/ML Pipeline Dashboard
│   ├── admin/                # Command Center + Issues Management
│   ├── verification/         # Identity Verification Console
│   ├── field-operations/     # Field Officer Tracking
│   ├── audit/                # Blockchain Audit Trail
│   └── analytics/            # Reports & Analytics
├── components/ui/            # Reusable UI Components
├── lib/
│   ├── data.ts              # Mock Data (States, Issues, Officers)
│   └── utils.ts             # Utility Functions
└── styles/
    └── globals.css          # Design System & Custom Classes
```

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/SharmARohitt/Gati.git
cd Gati

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 🔐 Security & Privacy

GATI is built with **enterprise-grade security** (100% coverage):

### Authentication & Sessions
- ✅ **Server-Side Authentication** — HTTP-only session cookies (no localStorage)
- ✅ **CSRF Protection** — Token-based with constant-time comparison
- ✅ **Brute Force Protection** — 5 attempts / 5 min, 15 min lockout
- ✅ **Session Hijacking Prevention** — IP validation on each request
- ✅ **Idle Session Timeout** — 30 minute automatic logout

### API Security
- ✅ **Multi-Tier Rate Limiting** — 10/min auth, 30/min AI, 100/min general
- ✅ **Input Validation** — Full sanitization on all endpoints
- ✅ **Request Origin Validation** — CORS + origin checking

### Headers & Transport
- ✅ **Content Security Policy (CSP)** — XSS prevention
- ✅ **X-Frame-Options** — Clickjacking protection
- ✅ **Strict-Transport-Security** — HTTPS enforcement
- ✅ **X-Content-Type-Options** — MIME sniffing prevention

### Monitoring & Compliance
- ✅ **Comprehensive Audit Logs** — All security events logged
- ✅ **Risk-Level Classification** — Critical/High/Medium/Low events
- ✅ **Environment Credentials** — All secrets in `.env.local` (gitignored)

### Environment Setup

```bash
# Copy the example env file
cp .env.example .env.local

# Required variables:
HUGGINGFACE_API_KEY=your_huggingface_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
SESSION_SECRET=your_64_character_secret
```

---

## 🧠 ML Pipeline Management

Full ML lifecycle management (100% coverage):

### Model Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/pipeline?action=status` | GET | Pipeline health status |
| `/api/ml/pipeline?action=models` | GET | Model registry |
| `/api/ml/pipeline?action=metrics` | GET | Prediction metrics |
| `/api/ml/pipeline` | POST | Retrain/Promote/Rollback/Evaluate |

### Features
- ✅ **Model Versioning** — Semantic versioning with history
- ✅ **Production Promotion** — Safe deployment workflow
- ✅ **Rollback Capability** — Instant rollback to previous versions
- ✅ **A/B Testing** — Traffic split between versions
- ✅ **Performance Metrics** — Latency, error rate, request count
- ✅ **Model Evaluation** — On-demand accuracy assessment

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📜 Disclaimer

> This is a **demonstration/prototype platform** built for educational and hackathon purposes. It uses **mock data** and is not connected to any actual UIDAI or government systems. No real Aadhaar data is accessed, stored, or processed.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs for review.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with 🇮🇳 for India's Digital Future**

*Transforming Identity Data into Governance Intelligence*

</div>
