# MISSED. — Vibe-coding prompt notes

## What this file records

This is an honest, partial prompt record—not a claim to reproduce the full original build history. The original prompts used to create the project were not included in this conversation. The reconstructed brief below is based on the project that exists in the repository; it is not presented as a verbatim prompt that was actually sent.

## Reconstructed project brief

> Build **MISSED.**, a polished, privacy-first web app that helps someone catch up on a busy team chat. Let the user paste a conversation or upload a plain-text export, configure their name and aliases, then analyze messages locally in the browser. Surface a concise executive summary, urgent actions, deadlines, decisions, direct mentions, unanswered questions, important updates, and a chronological timeline. Make each result traceable to its source message, allow action items to be checked off, and support exporting the briefing. Use a distinctive editorial interface with a friendly animated bot, clear hierarchy, responsive layouts, and accessible interactions. Be transparent about uncertain dates and keep chat data in volatile browser memory rather than sending it to a service.

## Exact project-improvement prompt available in this conversation

> Task 1: text is looking bad and unclear due to the black dark UI. Improve it and don't make it look like made by AI, like I need a creative, professional UI with animations and bots.
>
> Task 2: "Today" is being detected from the chat text even when the message is from yesterday. Use the message timeline/date, not just the word in the message. Some chats also don't show a checkbox. Make this accurate.

## Optional prompts for future work

The following are suggested prompts, written now as possible next steps. They are **not** part of the historical prompt record and should not be represented as prompts already used.

### Improve date accuracy

> Review the chat-export date formats supported by MISSED. Add tests for ambiguous dates, timezone boundaries, and relative deadlines such as "today", "tomorrow", and weekdays. Use each message's parsed timestamp as the reference for relative dates, compare the resulting deadline with the current date, and clearly flag dates that cannot be resolved safely.

### Improve evidence and interaction quality

> Audit every briefing item category in MISSED. Ensure each item has an accessible completion control, a working source-message link, and an explanation grounded in the cited message. Add focused tests for item state changes and source references without changing unrelated UI behavior.

### Improve the visual experience

> Refine MISSED.'s visual design into a readable, warm editorial workspace. Improve text contrast, spacing, responsive behavior, keyboard focus, and reduced-motion support. Keep the existing Sentry bot character, use animation sparingly, and avoid adding visual effects that reduce clarity or accessibility.
