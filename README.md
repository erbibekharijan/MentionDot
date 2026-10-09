# MISSED.

> **“Catch up on what matters. Keep your chats yours.”**  
> *A privacy-first conversation briefing, powered by explainable rules that run in your browser.*

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
- **Source-linked findings**: Findings include the originating message when the local rules can identify one; inspect the quote before acting.

---

## 🔒 Technical Privacy Guarantee

Privacy in MISSED. is an architectural property, not a marketing claim:

1. **In-browser analysis**: Message parsing, date extraction, priority scoring, and classification run in your browser. Chat text is not sent to a server. The page loads fonts from Google Fonts, which receives normal connection metadata but not your conversation content.
2. **Zero Cloud Database Storage**: No Supabase, Firebase, or external database is required or connected.
3. **Transient In-Memory Chat State**: Messages, briefings, and checklist changes exist only in React memory. Chat content is never written to `localStorage` or `IndexedDB`.
4. **One Non-Content Preference**: `localStorage` stores a single boolean indicating whether the optional first-visit guided demo was started or skipped. It contains no messages or analysis and survives “Clear Data” so the welcome does not reappear. Clearing browser site data resets it.
5. **Clear Current Session**: Clicking **"Clear Data"** immediately purges the current conversation and briefing from React memory. The guided-demo preference is intentionally retained.
6. **Deterministic heuristics, not generative AI**: Findings are produced by local rules, not an AI model. They can be wrong or miss context; source links help you verify the evidence, but do not independently verify an interpretation.

## 🧱 Architecture and security

MISSED. is intentionally a static, client-only application; it does not need accounts, an API server, or a database to analyze a pasted export. The analysis pipeline is layered into four distinct tiers:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                          MISSED. Analysis Pipeline                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Chat export (paste / file upload)                                         │
│       │                                                                    │
│       ▼                                                                    │
│  ┌──────────────────────────────────────────────────┐                     │
│  │  Tier 1: Content-hash LRU Cache (heap-only)      │                     │
│  │  deriveCacheKey() → djb2 hash of text + config   │                     │
│  │  Hit: returns cached AnalysisResult instantly    │                     │
│  │  Miss: falls through to Worker tier              │                     │
│  └────────────────────┬─────────────────────────────┘                     │
│                       │ cache miss                                         │
│                       ▼                                                    │
│  ┌──────────────────────────────────────────────────┐                     │
│  │  Tier 2: Analysis Web Worker (off main thread)   │                     │
│  │  • Runtime-validated typed request/response      │                     │
│  │  • parseConversation() → structured Message[]    │                     │
│  │  • LocalHeuristicProvider.analyze() → items      │                     │
│  │  • startMeasurement() → durationMs in response  │                     │
│  │  • Superseded workers are immediately terminated │                     │
│  └────────────────────┬─────────────────────────────┘                     │
│                       │ typed AnalysisResponse                             │
│                       ▼                                                    │
│  ┌──────────────────────────────────────────────────┐                     │
│  │  Tier 3: Performance Monitor (ring buffer)       │                     │
│  │  • High-precision Performance API timing         │                     │
│  │  • TimingRingBuffer retains last 20 samples      │                     │
│  │  • Cache hits also recorded (0 ms duration)      │                     │
│  │  • Zero external transmission                    │                     │
│  └────────────────────┬─────────────────────────────┘                     │
│                       │ AnalysisResult                                     │
│                       ▼                                                    │
│  ┌──────────────────────────────────────────────────┐                     │
│  │  Tier 4: React UI (main thread)                  │                     │
│  │  • Interactive briefing + source inspector       │                     │
│  │  • Source IDs link every finding to its message  │                     │
│  │  • All chat state lives in React memory only     │                     │
│  └──────────────────────────────────────────────────┘                     │
│                                                                            │
│  Offline: Service Worker precaches hashed JS/CSS/worker assets             │
│  Security: Vercel CSP + Permissions-Policy + no-cache for chat data        │
└────────────────────────────────────────────────────────────────────────────┘
```

The worker validates request/response shapes at runtime (including `durationMs` on success), superseded work is terminated, stale messages are ignored, and failures are surfaced in the interface. The LRU cache (`AnalysisLRUCache`) deduplicates repeated analyses of the same conversation within a session — entries expire after 10 minutes and the cache is bounded to 10 entries to prevent unbounded memory growth. The only persistent application preference is whether the optional tour was seen; the service worker precaches generated app assets and does not dynamically cache arbitrary requests. Vercel responses also set a Content Security Policy, disable framing and MIME sniffing, restrict browser permissions, and apply a conservative referrer policy.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Test Runner**: Vitest (63 passing unit tests across 7 test files)
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

### Keyboard and motion accessibility

- Dialogs and the source inspector move keyboard focus into the open panel, keep Tab navigation within it, close with **Escape**, and return focus to the opening control.
- The guided tour can be dismissed with **Escape** and announces its progress to assistive technology.
- Tour and evidence navigation use non-animated scrolling when reduced motion is enabled in the operating system.

### 3. Run Automated Unit Tests
```bash
npm test
```
Runs **63 automated Vitest unit tests across 7 test files** verifying:
- Bracketed and unbracketed message parsing
- Multiline continuation and malformed line preservation
- Urgency and priority scoring
- Deadline parsing and ambiguous date detection
- Mention and decision extraction
- Ground-truth message ID traceability
- Chronological story selection and source-message integrity
- Markdown and Plain Text export formatting
- Worker request/response validation, lifecycle, failures, cancellation, and stale-message handling
- **LRU cache**: key derivation, TTL expiry, LRU eviction, MRU promotion, diagnostics, singleton round-trip
- **Performance monitor**: startMeasurement accuracy, TimingRingBuffer capacity, eviction, average, clear, copy safety

### 4. Build for Production
```bash
npm run build
```

---

## ⏱️ 60-Second Hackathon Demo Script

1. **Open MISSED.** in your browser at `http://localhost:5173`.
2. On first visit, choose **Start guided demo**; choose **Skip tour** to go straight to the app. The header **TOUR** button can replay it later.
3. In the guided demo, load the fictional sample and follow the short chronological story.
4. Open a highlighted source citation:
   - Confirm the source message and timestamp appear in the inspector; note that source matching does not fact-check the claim.
5. Continue through the checkbox, filters, and export/privacy controls.
6. For a quick unguided walkthrough, click **"Explore demo (40+ msgs)"**:
   - The app instantly parses a 40-message realistic sprint chat with 6 participants.
   - The **Executive Summary** highlights the 5 critical developments.
7. Review the **Act Now** section:
   - Notice the **URGENT** production Redis buffer blocker reported by Alex.
   - Notice the direct task assigned to **Bibek** to patch the auth handler before deploy tonight.
8. Click **"msg-16"** on Bibek's card:
   - The **Conversation Source Inspector** slides out and smoothly scrolls to and highlights the exact raw source message.
9. Toggle the **Checkbox** on a completed item to observe real-time task status updates.
10. Switch to the **"Decisions"** filter tab:
   - See the confirmed agreement to use Tailwind v4 for ProtocolX.
11. Click **"Export .MD"** or **"Copy Summary"** to export the briefing.
12. Click **"Clear Data"** to clear the current conversation and briefing; the tutorial choice is kept.

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
│   ├── __tests__/                  # 63 automated unit tests across 7 files
│   │   ├── analysisCache.test.ts   # LRU cache: TTL, eviction, MRU, diagnostics (18 tests)
│   │   ├── analysisWorker.test.ts  # Worker lifecycle, cancellation, stale msgs (6 tests)
│   │   ├── analyzer.test.ts        # Urgency, decisions, mentions, timeline (11 tests)
│   │   ├── catchUpStory.test.ts    # Chronological story and source integrity (2 tests)
│   │   ├── exporter.test.ts        # Markdown & TXT formatting tests (2 tests)
│   │   ├── parser.test.ts          # Multi-format message parser tests (9 tests)
│   │   └── perfMonitor.test.ts     # TimingRingBuffer, startMeasurement (15 tests)
│   ├── components/                 # Modular React components
│   │   ├── AiConsentModal.tsx      # Optional remote AI architecture modal
│   │   ├── CatchUpStory.tsx        # Short chronological story with evidence links
│   │   ├── Dashboard.tsx           # Catch-up inbox (Sections A through H)
│   │   ├── GuidedDemo.tsx          # First-visit and replayable guided walkthrough
│   │   ├── InputSection.tsx        # Paste, file upload, & alias configuration
│   │   ├── ItemCard.tsx            # Cards with priority, "why it matters", & source ref
│   │   ├── LandingHero.tsx         # Hero, benefits, preview, & method indicators
│   │   ├── Navbar.tsx              # Brand, live privacy badge, & actions
│   │   ├── PrivacyModal.tsx        # Technical privacy guarantee breakdown
│   │   └── SourceViewer.tsx        # Raw message inspector with target jump & search
│   ├── data/
│   │   └── sampleConversation.ts   # 40+ message realistic Hackathon dataset
│   ├── hooks/
│   │   ├── useDialogAccessibility.ts  # Keyboard focus trap for dialogs
│   │   └── useLocalAnalysisWorker.ts  # Cached + cancellable worker hook
│   ├── types/
│   │   ├── guidedDemo.ts           # Tour states and local preference key
│   │   └── index.ts                # Core TypeScript data contracts
│   ├── utils/
│   │   ├── analysisCache.ts        # LRU cache: djb2 hash, TTL, bounded eviction
│   │   ├── analyzer.ts             # Local-first explainable heuristic engine
│   │   ├── catchUpStory.ts         # Chronological narrative generator
│   │   ├── dateParser.ts           # Deadline extractor & ambiguity reasoner
│   │   ├── exporter.ts             # Markdown & TXT report generators
│   │   ├── parser.ts               # Robust multi-format chat log parser
│   │   └── perfMonitor.ts          # High-precision perf timing + ring buffer
│   ├── workers/
│   │   ├── analysis.worker.ts      # Worker entrypoint with startMeasurement
│   │   ├── analysisClient.ts       # Typed worker lifecycle + perf buffer integration
│   │   └── analysisProtocol.ts     # Runtime-validated request/response contracts
│   ├── App.tsx                     # Top-level state coordinator
│   ├── index.css                   # Tailwind CSS v4 & custom scrollbar styling
│   └── main.tsx                    # React DOM entrypoint
├── index.html                      # Clean semantic HTML5 with SEO meta & fonts
├── package.json                    # Dependencies and test scripts
├── tsconfig.json                   # Strict TypeScript configuration
├── vercel.json                     # Vercel SPA routing, CSP, Permissions-Policy
└── vite.config.ts                  # Vite 8 + Tailwind CSS v4 + service worker plugin
```

---

## 🏆 Hackathon Compliance & Integrity Note

- **No fabricated metrics**: All statistics represent actual parsed conversation metrics.
- **No fake integrations**: Raw chat text and exported files are explicitly supported; no phantom third-party APIs are claimed.
- **No black-box hallucinated deadlines**: Ambiguous dates without specified month or year are clearly flagged with documented ambiguity reasons.
- **Privacy transparency**: Conversation processing stays client-side; the only persisted app preference is the guided-tour flag, which contains no chat data.
- **Guided demo**: Optional first-visit walkthrough of importing, reading the story, checking source evidence, and using the briefing. The header **Take a tour** button replays it on demand. Finishing or skipping clears the temporary sample and restores any chat/briefing that was open before the tour.
