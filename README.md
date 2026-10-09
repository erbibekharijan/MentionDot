# MISSED.

> **“Catch up on what matters. Keep your chats yours.”**  
> *The AI-powered, privacy-first conversation intelligence inbox for Protocol X Hackathon.*

---

## 🚀 Overview

People return to hundreds of unread messages across group chats, team channels, and project discussions. Critical deadlines, explicit decisions, urgent requests, and direct mentions get buried under social chatter and noise.

**MISSED.** converts overwhelming conversations into an **evidence-backed, prioritized briefing** in seconds:
- **Executive Summary**: 3–6 concise bullets explaining major developments.
- **Act Now**: Urgent tasks, outages, and action items with priority ranking.
- **Upcoming Deadlines**: Chronological calendar cutoffs, distinguishing overdue, due today, upcoming, and ambiguous dates.
- **Decisions Made**: Agreed technology choices, schedule shifts, and finalized plans.
- **You Were Mentioned**: Targeted mentions matching your identity and aliases.
- **Waiting On**: Potential unanswered questions and blockers needing response.
- **Conversation Timeline**: Interactive chronological milestones with source links.
- **100% Traceability**: Every single item links directly to its source message in the conversation inspector.

---

## 🔒 Technical Privacy Guarantee

Privacy in MISSED. is an architectural property, not a marketing claim:

1. **100% In-Browser Execution**: All message parsing, date extraction, priority scoring, and classification run entirely inside your browser's JavaScript runtime.
2. **Zero Cloud Database Storage**: No Supabase, Firebase, or external database is required or connected.
3. **Transient In-Memory State**: Messages and briefings exist solely in volatile React state. Nothing is written to `localStorage` or `IndexedDB` by default.
4. **Instant Zero-Trace Reset**: Clicking **"Clear Data"** immediately purges all state from memory.
5. **Deterministic Heuristics over Black-Box Hallucinations**: We explicitly distinguish deterministic local heuristics from remote generative AI. If an optional remote model is ever connected, explicit informed consent is required before transmitting data.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Test Runner**: Vitest (22 passing unit tests)
- **Deployment**: Static Site Hosting (Vercel Ready)

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- Node.js (v18+ or v24+ recommended)
- npm

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Unit Tests
```bash
npm test
```
Runs 22 automated Vitest unit tests verifying:
- Bracketed and unbracketed message parsing
- Multiline continuation and malformed line preservation
- Urgency and priority scoring
- Deadline parsing and ambiguous date detection
- Mention and decision extraction
- Ground-truth message ID traceability
- Markdown and Plain Text export formatting

### 4. Build for Production
```bash
npm run build
```

---

## ⏱️ 60-Second Hackathon Demo Script

1. **Open MISSED.** in your browser at `http://localhost:5173`.
2. Notice the **Live Privacy Indicator** in the header: *"100% Local & In-Memory"*.
3. Click **"Explore demo (40+ msgs)"**:
   - The app instantly parses a 40-message realistic sprint chat with 6 participants.
   - The **Executive Summary** highlights the 5 critical developments.
4. Review the **Act Now** section:
   - Notice the **URGENT** production Redis buffer blocker reported by Alex.
   - Notice the direct task assigned to **Bibek** to patch the auth handler before deploy tonight.
5. Click **"msg-16"** on Bibek's card:
   - The **Conversation Source Inspector** slides out and smoothly scrolls to and highlights the exact raw source message.
6. Toggle the **Checkbox** on a completed item to observe real-time task status updates.
7. Switch to the **"Decisions"** filter tab:
   - See the confirmed agreement to use Tailwind v4 for ProtocolX.
8. Click **"Export .MD"** or **"Copy Summary"** to export the briefing.
9. Click **"Clear Data"** to demonstrate complete volatile memory purge.

---

## 🚢 Deployment to Vercel

MISSED. is architected as a pure static web app with zero backend servers:

### Option A: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Deploy via GitHub & Vercel Dashboard
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of MISSED."
   git remote add origin https://github.com/<your-username>/missed.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects the Vite framework settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your app will be live with full static caching and edge delivery.

---

## 📁 Project Architecture

```
ProtocolX/
├── src/
│   ├── __tests__/             # Automated unit tests
│   │   ├── analyzer.test.ts   # Urgency, decisions, mentions, timeline tests
│   │   ├── dateParser.test.ts # Date and ambiguous cutoff tests
│   │   ├── exporter.test.ts   # Markdown & TXT formatting tests
│   │   └── parser.test.ts     # Multi-format message parser tests
│   ├── components/            # Modular React components
│   │   ├── AiConsentModal.tsx # Optional remote AI architecture modal
│   │   ├── Dashboard.tsx      # Catch-up inbox (Sections A through H)
│   │   ├── InputSection.tsx   # Paste, file upload, & alias configuration
│   │   ├── ItemCard.tsx       # Cards with priority, "why it matters", & source ref
│   │   ├── LandingHero.tsx    # Hero, benefits, preview, & method indicators
│   │   ├── Navbar.tsx         # Brand, live privacy badge, & actions
│   │   ├── PrivacyModal.tsx   # Technical privacy guarantee breakdown
│   │   └── SourceViewer.tsx   # Raw message inspector with target jump & search
│   ├── data/
│   │   └── sampleConversation.ts # 40+ message realistic Hackathon dataset
│   ├── types/
│   │   └── index.ts           # Core TypeScript data contracts
│   ├── utils/
│   │   ├── analyzer.ts        # Local-first explainable heuristic engine
│   │   ├── dateParser.ts      # Deadline extractor & ambiguity reasoner
│   │   ├── exporter.ts        # Markdown & TXT report generators
│   │   └── parser.ts          # Robust multi-format chat log parser
│   ├── App.tsx                # Top-level state coordinator
│   ├── index.css              # Tailwind CSS v4 & custom scrollbar styling
│   └── main.tsx               # React DOM entrypoint
├── index.html                 # Clean semantic HTML5 with SEO meta & fonts
├── package.json               # Dependencies and test scripts
├── tsconfig.json              # Strict TypeScript configuration
├── vercel.json                # Vercel SPA routing and build configuration
└── vite.config.ts             # Vite 8 + Tailwind CSS v4 plugin setup
```

---

## 🏆 Hackathon Compliance & Integrity Note

- **No fabricated metrics**: All statistics represent actual parsed conversation metrics.
- **No fake integrations**: Raw chat text and exported files are explicitly supported; no phantom third-party APIs are claimed.
- **No black-box hallucinated deadlines**: Ambiguous dates without specified month or year are clearly flagged with documented ambiguity reasons.
- **Privacy-verified**: 100% client-side memory safety verified by code.
