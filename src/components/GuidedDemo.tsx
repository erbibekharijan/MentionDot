import React, { useEffect } from 'react';
import { ArrowRight, BookOpenCheck, Check, ChevronRight, X } from 'lucide-react';
import type { GuidedDemoStep } from '../types/guidedDemo';

interface GuidedDemoProps {
  step: GuidedDemoStep | null;
  notice: string | null;
  onStart: () => void;
  onSkip: () => void;
  onLoadDemo: () => void;
  onAdvance: () => void;
}

const TOUR_TARGETS: Partial<Record<GuidedDemoStep, string>> = {
  input: 'input-section',
  story: 'catch-up-story',
  source: 'story-source',
  evidence: 'source-evidence',
  task: 'completion-toggle',
  filters: 'filters',
  tools: 'briefing-tools',
};

const TOUR_CONTENT: Partial<
  Record<GuidedDemoStep, { title: string; body: string; action: string; progress: number }>
> = {
  input: {
    title: 'Start with a conversation',
    body: 'Paste a chat or upload a text export here. Set your name and aliases so MISSED. can spot direct mentions. This walkthrough uses a fictional sample; your own chats are not needed.',
    action: 'Load sample and continue',
    progress: 1,
  },
  story: {
    title: 'Get the short version',
    body: 'This story picks a few different signals and puts them in chat order. Each beat shows the original quote, sender, and timestamp. The local rules can be wrong, so check the evidence.',
    action: 'Show me a source',
    progress: 2,
  },
  source: {
    title: 'Follow the citation',
    body: 'Click the highlighted Source link on a story beat. MISSED. will open the matching message from the imported conversation.',
    action: 'Open a source link to continue',
    progress: 3,
  },
  evidence: {
    title: 'Check the original message',
    body: 'The drawer shows the source text and the timestamp as provided in the export. This confirms where a finding came from—it does not independently verify the message or prove the interpretation is correct.',
    action: 'Continue',
    progress: 4,
  },
  task: {
    title: 'Track what you have handled',
    body: 'Use a checkbox to mark any briefing item complete. That only changes your in-page checklist; it does not alter the source chat or confirm the underlying request was fulfilled.',
    action: 'Explore the filters',
    progress: 5,
  },
  filters: {
    title: 'Narrow down the noise',
    body: 'Filter by urgency or finding type, search the source-backed findings, and sort by priority, sender, or chat order.',
    action: 'Show report tools',
    progress: 6,
  },
  tools: {
    title: 'Make the briefing yours',
    body: 'Copy the summary or export a report. The privacy control explains what stays in your browser. Reset clears the current chat and briefing while keeping the tour preference.',
    action: 'Finish tour',
    progress: 7,
  },
  finish: {
    title: 'You are ready to catch up',
    body: 'Use MISSED. with your own export whenever you like. The guided demo will not pop up again after refresh or reset. Choose Guided tour in the header to replay it.',
    action: 'Done',
    progress: 8,
  },
};

export const GuidedDemo: React.FC<GuidedDemoProps> = ({
  step,
  notice,
  onStart,
  onSkip,
  onLoadDemo,
  onAdvance,
}) => {
  useEffect(() => {
    if (!step || step === 'welcome') return;

    const targetName = TOUR_TARGETS[step];
    if (!targetName) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${targetName}"]`);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('guided-tour-target');
    return () => target.classList.remove('guided-tour-target');
  }, [step]);

  if (!step) return null;

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#202a35]/45 p-4 backdrop-blur-sm">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-demo-welcome-title"
          className="w-full max-w-lg rounded-3xl border border-[#e3ddd2] bg-[#fffefa] p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-5 inline-flex rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#80500e]">
            A 1-minute product tour
          </p>
          <h2 id="guided-demo-welcome-title" className="mt-2 text-2xl font-bold tracking-tight text-[#202a35]">
            See how MISSED. works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#536170]">
            Follow a fictional team chat from import to story, source evidence, and action list.
            You can skip now, or replay the tour later from the header.
          </p>
          {notice && (
            <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {notice}
            </p>
          )}
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-[#e3ddd2] px-4 py-2.5 text-sm font-semibold text-[#536170] transition hover:bg-[#f5f2eb]"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#263442] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#344657]"
            >
              Start guided demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  const content = TOUR_CONTENT[step];
  if (!content) return null;

  const handlePrimaryAction = step === 'input' ? onLoadDemo : onAdvance;

  return (
    <aside
      aria-label="Guided product tour"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-2xl rounded-2xl border border-[#ded7ca] bg-[#fffefa]/[.98] p-4 shadow-[0_18px_60px_rgba(32,42,53,0.2)] backdrop-blur sm:inset-x-auto sm:bottom-5 sm:right-5 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
          {step === 'finish' ? <Check className="h-4 w-4" /> : <BookOpenCheck className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#80500e]">
              Guided demo · {content.progress} of 8
            </p>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg p-1 text-[#667382] transition hover:bg-[#f1ece2] hover:text-[#202a35]"
              aria-label="Skip and close guided demo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-1 text-base font-bold text-[#202a35]">{content.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#536170]">{content.body}</p>
          {notice && (
            <p role="status" className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              {notice}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5" aria-label={`Step ${content.progress} of 8`}>
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-5 rounded-full ${
                    index < content.progress ? 'bg-[#b9781b]' : 'bg-[#e8e2d7]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#667382] transition hover:bg-[#f1ece2]"
              >
                Skip tour
              </button>
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={step === 'source'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#263442] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#344657]"
              >
                {content.action}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
