# MISSED. — Vibe-coding prompt record

## Scope and accuracy

This file records the project-related prompts visible in the conversation used for this repository work. User prompts below are transcribed from that conversation; small formatting changes only add quotation blocks and headings.

This is not the complete historical prompt log for the original project. The prompts used before this conversation, including any prompts in another editor or vibe-coding tool, were not provided here and cannot be recovered from the source code. The project brief below is a reconstruction based on the current app, not a claim about what was originally typed.

## Reconstructed project brief — not a verbatim historical prompt

> Build **MISSED.**, a privacy-first app that helps people catch up on busy team chats. Let users paste a conversation or upload a plain-text export, configure their name and aliases, and analyze messages locally in the browser. Surface an executive summary, urgent actions, deadlines, decisions, direct mentions, unanswered questions, important updates, and a chronological timeline. Link findings to their source messages, allow checklist items to be marked complete, and support exporting the briefing. Use a distinctive, readable interface with a friendly animated bot, responsive layouts, and accessible interactions. Clearly flag ambiguous dates and avoid sending chat content to a service.

## User prompts visible in this conversation

### 1. Initial UI and accuracy request

> Task 1: text is looking bad and unclear due to the black dark ui,
> Improve it and dont make it look like made by AI, Like i need a creative UI professional with animations and bots etc.
>
> Task 2:there is an issue that, it says "Today" just based on it sees the text 'Today' in the chat even though if it's yesterday's message ignoring the timeline of when the data is sent, fix that. I am not even getting tick box for some chats. I want it to be fucking accurate.

### 2. GitHub publishing and prompt-file request

> https://github.com/erbibekharijan/MentionDot.git
>
> this is my githuub, more i push, more I am getting point. Based on commit I am getting points.
>
> Add prompt.md too including what what prompt i gave to vibe code this project. You can add imaginary adding prompt by yourself.
>
> Just dont forget to push it a lot every section and all I have to win man
>
> Since its a vibe codding hackathon project.

### 3. Product differentiation

> It still does't feel like hackathon winning, since everyone is vibecodding, i need to do different than them what else shall I add

### 4. Reaction to the Change Radar suggestion

> why shall I add change radar, both of us will have same text right, he downloaded the chat that i did, file wont change for me

### 5. Catch-up story and trust cues

> Show a short story
> Make the result trustworthy
> implement this

### 6. Run the app

> run it

### 7. Ask where the trust cues appear

> where is trust cues added, what is it mentioned as, can u show an example

### 8. Hosting and pushing status

> is the website ready to be hosted and are you pushing it as i said

### 9. Commit-count concern

> i many commit is there, my winning factor depends on commit too

### 10. Guided demo request

> add a demo mode, also skip option to skip demo if dont want demo, demo will take you through everything. how to use, where to go and all. Demo shall not pop again after refreshing website, or after reset. Is it good thing to add?

### 11. Request to complete this file

> did u update prompt.md, it shoud have everything

### 12. Replay tour and return after completion

> can u add a button if someone needs a tour anytime they need they get, and after the tour is finished, they should be redirected to home page again, because the catch me uses demo message for the tour, if anyone skip tour in middle or finish tour, they stay as it is, seeing demo chat data.

### 13. Small changes without changing app logic

> can u do some multiple minor changes, like change unchanage etc and keep pushing on github, so that I have multiple commit because no of comitd = extra points. just dont disturb the actual project logic ok

The selected implementation was a real accessibility improvement rather than no-op or reverted commits: keyboard-operable dialogs and guided tour, clear focus indication, and reduced-motion-aware scrolling. No analysis or chat behavior was changed.

## Suggested prompts for possible future work — not prompts already used

These are optional prompts drafted as ideas. They are not part of the historical user-prompt log.

### Improve date accuracy

> Review the chat-export date formats supported by MISSED. Add tests for ambiguous dates, timezone boundaries, and relative deadlines such as "today", "tomorrow", and weekdays. Use each message's parsed timestamp as the reference for relative dates, compare the resulting deadline with the current date, and clearly flag dates that cannot be resolved safely.

### Improve evidence and interaction quality

> Audit every briefing item category in MISSED. Ensure each item has an accessible completion control, a working source-message link, and an explanation grounded in the cited message. Add focused tests for item state changes and source references without changing unrelated UI behavior.

### Improve the visual experience

> Refine MISSED.'s visual design into a readable, warm editorial workspace. Improve text contrast, spacing, responsive behavior, keyboard focus, and reduced-motion support. Keep the existing Sentry bot character, use animation sparingly, and avoid adding visual effects that reduce clarity or accessibility.

### Improve keyboard accessibility

> Audit dialogs, drawers, and guided walkthroughs in MISSED. Ensure dialogs have accessible names, move focus into the dialog, keep keyboard focus inside while open, close with Escape, and restore focus to the control that opened them. Make guided-tour progress understandable to screen readers and respect reduced-motion preferences for programmatic scrolling.
