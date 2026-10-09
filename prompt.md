# MISSED. — Product brief, prompt record, and evaluation guide

## Project in one sentence

**MISSED. turns a long team-chat export into a short, reviewable catch-up briefing, with findings linked to their source messages and all chat analysis performed on-device.**

## The problem and the product decision

Important requests, decisions, schedule changes, and deadlines disappear in busy group chats. MISSED. lets a person paste a chat export or load a text file, set their name and aliases, and scan a structured briefing instead of rereading the entire conversation.

The product is intentionally a **local-first, explainable tool**, not a chatbot that claims to know what a team meant. Its local rules find candidate signals; the person checks the original message before acting. A source citation shows where a finding came from, not whether the interpretation is true.

### What a participant can do

- Paste or upload a text conversation and configure the names used to detect direct mentions.
- Review an executive summary, prioritized tasks, deadlines, decisions, mentions, questions, announcements, and a conversation timeline.
- Open linked source messages, inspect their original text and supplied timestamps, and search the imported messages.
- Mark briefing items complete, filter and sort findings, and export a briefing as Markdown or plain text.
- Follow an optional guided tour, replay it later, or explore the larger fictional sample.
- Use the production app shell offline after its first successful visit; analysis still happens locally.

## Design principles

1. **Evidence before confidence.** Findings retain a stable source-message ID. The source inspector presents the original message and timestamp so a person can check the evidence. Heuristics can be wrong; a citation is not independent verification.
2. **Timeline-aware dates.** Relative date language is evaluated against the message timestamp when available, then compared with the current date. Dates that cannot be resolved safely are marked uncertain rather than presented as fact.
3. **Privacy is part of the architecture.** Parsing and full analysis run on the device in a Web Worker. Chat text and analysis results are not sent to an analysis API or stored by the service worker.
4. **A briefing is a queue, not a verdict.** Checkboxes are a local review aid; checking an item does not change the original conversation or prove that work was done.
5. **Keep the interface usable under real conditions.** The interface is responsive, has keyboard-accessible dialogs and visible focus, supports reduced-motion preferences for guided scrolling, and introduces the product through a skippable and replayable tour.

## Architecture and data flow

```text
Paste / text upload
        │
        ├── lightweight message-count preview
        │
        └── typed request ──> analysis Web Worker
                                  ├── parse conversation
                                  ├── run deterministic local rules
                                  └── return typed result with source IDs
                                                   │
                                                   v
                                     interactive briefing and source inspector
```

- **Client:** React 19, TypeScript, Vite, and Tailwind CSS. It is a static application; analysis does not require accounts, an API server, or a database.
- **Analysis boundary:** a module Web Worker receives a typed request and returns a typed success or error response. Superseded work is terminated so an old analysis cannot overwrite a newer result. Analysis failures are surfaced to the user.
- **Offline behavior:** the production build generates a service worker that precaches the application shell, hashed JavaScript and CSS, and the analysis worker. It caches same-origin application GET responses for offline use. It does not persist conversations or analysis results.
- **Persistence:** the guided-tour preference is the only application preference stored in `localStorage`. Conversation text, parsed messages, results, and checklist changes live in application memory.
- **Deployment protections:** Vercel response headers include a restrictive Content Security Policy, `worker-src 'self'`, framing and MIME-sniffing protections, a referrer policy, and a restrictive Permissions Policy. Google Fonts is used for presentation; the stylesheet provider can receive normal connection metadata, but the app does not send it chat text.

## Evaluation guide: claims reviewers can verify

This is an evidence map, not a claim about what an automated evaluator will award. Scores are determined by the event's evaluator; no score is promised here.

| Criterion | Verifiable evidence in MISSED. | Honest scope |
|---|---|---|
| **Innovation & Novelty** | An evidence-linked, chronological catch-up story; priority queues, date-aware deadlines, source inspection, a fictional guided walkthrough, and a local checklist combine into a focused chat-triage workflow. | This is a practical workflow built from explainable heuristics, not a novel language model or a claim of perfect understanding. |
| **Code Standards & Quality** | Typed TypeScript contracts; parsing, analysis, UI, worker protocol, and export utilities are separated; parser, analyzer, story, export, and worker-boundary tests exercise key behavior. | The codebase is compact and client-side; tests cover important behavior, not every browser, export format, or possible chat syntax. |
| **UI / UX & Impact** | Responsive briefing and source inspector, actionable filters, exports, fictional sample, replayable/skippable tour, keyboard-operable dialogs, visible focus, and reduced-motion-aware navigation. | The product helps users review candidate findings; it does not read private chat accounts or take actions on their behalf. |
| **Backend & Architecture** | A typed Web Worker keeps full parsing and analysis off the main UI thread; a generated service worker enables app-shell caching; static deployment keeps operating requirements small. | There is deliberately no cloud backend or database. Do not describe the worker or service worker as a server-side backend. Local-only privacy is a product tradeoff, not a missing feature presented as implemented. |
| **Security & Optimization** | Chat analysis is local; analysis requests are cancellable; the app shell cache excludes user conversation state; security response headers constrain browser capabilities and resource origins; only same-origin GETs are handled by the service worker. | The app does not promise zero network activity: the UI loads Google Fonts. Browser extensions, compromised devices, and errors in the local heuristics are outside the app's guarantees. |

## Current verification record

Validated for the changes documented here:

- `npm run build` — production build succeeds and emits the analysis worker and `sw.js`.
- `npm test` — **25 tests pass across 5 test files**, including a worker-boundary test that checks source-message integrity.
- `npm run lint` — completes without warnings.
- Production preview — the fictional sample produced a briefing without an analysis error; browser inspection confirmed the active service worker cached the app shell and analysis-worker bundle.
- `git push` — the implementation was pushed to the configured `master` branch. The latest commit recorded when this document was updated is `65c3d45` (`feat: move analysis off the UI thread`). A successful push does not by itself prove that a hosting provider has deployed that commit; verify the live deployment before submitting it.

## Prompt strategy — concise master brief

The following is a **consolidated product/specification prompt**, written from the implemented project and user direction. It is not claimed to be an exact historical prompt from an earlier editor or AI session.

> Build MISSED., a polished, responsive, privacy-first team-chat catch-up app. Users can paste or upload plain-text exports, configure their own name and aliases, and get a concise briefing of candidate actions, deadlines, decisions, direct mentions, unanswered questions, important updates, and a chronological story. Make every extracted finding traceable to its original message when possible; show its evidence and timestamp, distinguish uncertain dates and heuristic interpretations, and never describe a source citation as fact-checking. Keep chat parsing and full analysis on the device in a cancellable Web Worker. Provide a typed worker protocol, clear error handling, focused tests, and an offline app shell that caches application assets only—not chats or results. Add accessible filters, a local checklist, exports, a fictional guided tour that can be skipped or replayed, visible keyboard focus, and reduced-motion support. Secure the static deployment with restrictive response headers. State accurately that this product uses deterministic rules, not a remote AI model; do not invent backend features, privacy guarantees, test results, or historical prompts. Validate the production build, tests, lint, worker behavior, and offline app-shell behavior before release.

## Project prompt and decision record

### Scope and historical accuracy

The user prompts below are transcribed from the project conversation available for this repository work; line breaks and section headings were added for readability. They are not a complete archive of prompts used in other tools or earlier sessions. Reconstructed or consolidated prompts are explicitly labeled as such and are not represented as historical user instructions.

### User prompts visible in this conversation

#### 1. Initial UI and accuracy request

> Task 1: text is looking bad and unclear due to the black dark ui,
> Improve it and dont make it look like made by AI, Like i need a creative UI professional with animations and bots etc.
>
> Task 2:there is an issue that, it says "Today" just based on it sees the text 'Today' in the chat even though if it's yesterday's message ignoring the timeline of when the data is sent, fix that. I am not even getting tick box for some chats. I want it to be fucking accurate.

#### 2. GitHub publishing and prompt-file request

> https://github.com/erbibekharijan/MentionDot.git
>
> this is my githuub, more i push, more I am getting point. Based on commit I am getting points.
>
> Add prompt.md too including what what prompt i gave to vibe code this project. You can add imaginary adding prompt by yourself.
>
> Just dont forget to push it a lot every section and all I have to win man
>
> Since its a vibe codding hackathon project.

#### 3. Product differentiation

> It still does't feel like hackathon winning, since everyone is vibecodding, i need to do different than them what else shall I add

#### 4. Reaction to the Change Radar suggestion

> why shall I add change radar, both of us will have same text right, he downloaded the chat that i did, file wont change for me

#### 5. Catch-up story and trust cues

> Show a short story
> Make the result trustworthy
> implement this

#### 6. Run the app

> run it

#### 7. Ask where the trust cues appear

> where is trust cues added, what is it mentioned as, can u show an example

#### 8. Hosting and pushing status

> is the website ready to be hosted and are you pushing it as i said

#### 9. Commit-count concern

> i many commit is there, my winning factor depends on commit too

#### 10. Guided demo request

> add a demo mode, also skip option to skip demo if dont want demo, demo will take you through everything. how to use, where to go and all. Demo shall not pop again after refreshing website, or after reset. Is it good thing to add?

#### 11. Request to complete this file

> did u update prompt.md, it shoud have everything

#### 12. Replay tour and return after completion

> can u add a button if someone needs a tour anytime they need they get, and after the tour is finished, they should be redirected to home page again, because the catch me uses demo message for the tour, if anyone skip tour in middle or finish it, they stay as it is, seeing demo chat data.

#### 13. Small changes without changing app logic

> can u do some multiple minor changes, like change unchanage etc and keep pushing on github, so that I have multiple commit because no of comitd = extra points. just dont disturb the actual project logic ok

The implementation chosen was a substantive accessibility change rather than no-op or reverted commits: keyboard-operable dialogs and tour controls, stronger focus indication, and reduced-motion-aware scrolling.

#### 14. Judging criteria and score-improvement request

> Innovation & Novelty:
>
> Code Standards & Quality:
>
> UI / UX & Impact:
>
> Backend & Architecture:
>
> Security & Optimization:
>
> these are the points determining factors, current highest point is 88.49, I need 95+
>
> https://hackjudge-participant-portal.vercel.app/
>
> this is the website where i publish my code and calculate points

The user subsequently reported the category scores **Innovation & Novelty 90, Code Standards & Quality 80, UI / UX & Impact 88, Backend & Architecture 70, and Security & Optimization 85**, with an overall score of **83.44**. To preserve local-only chat analysis, they chose to strengthen architecture with a Web Worker, offline support, and focused tests rather than add a server that receives chat text.

#### 15. Prompt-file scoring request

> i think the website is also checking prompt md to give points, so include awesome points in prompt md and all for points

This file responds with a judge-facing, evidence-based project brief. It distinguishes implemented behavior from design intent, and actual visible prompts from reconstructed prompt text; it does not claim to know the portal's scoring formula.
