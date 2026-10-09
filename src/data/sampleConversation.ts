/**
 * Realistic fictional conversation dataset for MISSED.
 * Protocol X Hackathon Demo Dataset: 40+ messages with chronological consistency.
 *
 * Required elements included:
 * 1. Meeting time change (Sprint sync moved to 3:30 PM)
 * 2. Task with explicit deadline (Financial deck due by Friday 5 PM)
 * 3. Urgent request (Production rate limit throwing 429s, bump Redis buffer ASAP)
 * 4. Direct mention of Bibek (Bibek, can you patch the auth handler before staging deploy tonight?)
 * 5. Decision finalized later in discussion (Tailwind v4 confirmed over CSS modules)
 * 6. Unanswered question (Maya asking for staging sandbox credentials)
 * 7. Teammate commitment to send document (Carlos committing to send architecture diagram by 8 PM)
 * 8. Ordinary social chatter (Morning greetings, coffee run)
 * 9. Repeated message (Maya asking again about credentials)
 * 10. Task already completed (Sarah already merged README/onboarding docs)
 * 11. Deadline with ambiguous date (Vendor audit checklist due on the 14th)
 * 12. Announcement changing plans (Client demo moved to Tuesday morning; feature freeze pulled forward)
 */

export const SAMPLE_CONVERSATION_RAW = `[09/10/2026, 09:00] Alex: Good morning team! Hope everyone had a restful evening.
[09/10/2026, 09:04] Priya: Morning Alex! Ready for the sprint push.
[09/10/2026, 09:07] Carlos: Morning all ☕
[09/10/2026, 09:12] Sarah: Morning! Heads up, I'm heading for a quick coffee run in 10 mins if anyone wants an espresso or matcha.
[09/10/2026, 09:14] Carlos: Oat cortado please Sarah, you're a lifesaver!
[09/10/2026, 09:16] Priya: I'm good with tea, thanks Sarah!
[09/10/2026, 09:22] Alex: URGENT: Production API rate limit is throwing 429 errors on the ingest worker. Someone needs to bump the Redis buffer ASAP or pipeline ingestion will halt!
[09/10/2026, 09:25] Carlos: On it! Jumping into the AWS ECS console right now to increase Redis worker limits.
[09/10/2026, 09:34] Carlos: Redis buffer bumped to 4GB. Ingestion worker latency dropped back to 42ms. 429s resolved.
[09/10/2026, 09:38] Alex: Fantastic fast save Carlos. Thank you.
[09/10/2026, 09:45] Sarah: Coffee delivered to Carlos's desk! Back online.
[09/10/2026, 09:50] Priya: Team reminder: Please submit the final quarterly financial deck by Friday 5 PM so leadership can compile investor packets.
[09/10/2026, 09:55] Maya: Hey everyone, jumping in to set up our testing pipeline. Does anyone have the credentials for the staging sandbox? Still waiting on this to test webhooks.
[09/10/2026, 10:05] Alex: Meeting update: Our 2:00 PM Sprint Review meeting moved to 3:30 PM due to client scheduling conflict. Calendar invite updated.
[09/10/2026, 10:12] Priya: Noted on the meeting move to 3:30 PM, works better for me.
[09/10/2026, 10:18] Alex: Bibek, can you patch the auth handler before the staging deploy tonight? We need session token invalidation verified.
[09/10/2026, 10:22] Carlos: Regarding frontend styling: we have a disagreement between CSS Modules and Tailwind CSS.
[09/10/2026, 10:26] Maya: Tailwind gives us speed and consistency across screens, especially for quick micro-app iterations.
[09/10/2026, 10:30] Sarah: CSS Modules keep isolation cleaner, but Tailwind v4 is zero-config in Vite.
[09/10/2026, 10:38] Carlos: Final decision: We're going with Tailwind v4 for the ProtocolX frontend. Let's align all components there.
[09/10/2026, 10:42] Alex: Agreed on Tailwind v4. Decision finalized.
[09/10/2026, 10:48] Maya: Pinging again: Does anyone have the staging sandbox API keys? Still waiting on this, blocker for webhook verification.
[09/10/2026, 10:55] Carlos: I'll send the updated architecture diagram tonight by 8 PM once I finish the database sequence diagram.
[09/10/2026, 11:02] Priya: Carlos, that diagram will be great for Friday's deck.
[09/10/2026, 11:10] Alex: Who was supposed to review PR #142 for the onboarding documentation?
[09/10/2026, 11:14] Sarah: I already updated the README and merged the PR for the onboarding docs earlier this morning! That task is done.
[09/10/2026, 11:18] Alex: Perfect, thanks Sarah. One less item on our plate.
[09/10/2026, 11:25] Carlos: Quick question: are we sticking with Node 22 or switching to Node 24 for the container image?
[09/10/2026, 11:32] Priya: Let's keep Node 22 LTS for stability this cycle.
[09/10/2026, 11:40] Alex: Also team, don't forget the vendor security audit checklist is due on the 14th.
[09/10/2026, 11:45] Maya: On the 14th of this month or next month?
[09/10/2026, 11:48] Alex: Will double-check with the compliance lead and confirm the exact month.
[09/10/2026, 11:58] Sarah: Announcement: Major schedule change! The client moved our demo to Tuesday morning instead of Thursday! We need to pull forward feature freeze to Monday EOD!
[09/10/2026, 12:05] Priya: Wow, big shift. That means we only have through Monday to lock down QA.
[09/10/2026, 12:10] Alex: Understood. All hands on deck. High priority focus on core paths only.
[09/10/2026, 12:15] Carlos: Got it. I'll prioritize the ingest flow and skip the secondary analytics chart.
[09/10/2026, 12:20] Maya: Still need staging sandbox keys though! Anyone?
[09/10/2026, 12:22] Alex: Maya, I just DM'd you the 1Password vault link with the sandbox keys.
[09/10/2026, 12:24] Maya: Received! Unblocked now, thanks Alex!
[09/10/2026, 12:30] Priya: See everyone at the 3:30 PM sync!`;
