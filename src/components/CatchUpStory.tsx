import React from 'react';
import { ArrowUpRight, BookOpenText, Clock3, ShieldCheck } from 'lucide-react';
import { buildCatchUpStory } from '../utils/catchUpStory';
import type { AnalysisResult } from '../types';

interface CatchUpStoryProps {
  result: AnalysisResult;
  onViewSource: (messageId: string) => void;
}

const CONFIDENCE_LABELS = {
  high: 'Strong rule match',
  medium: 'Partial rule match',
  low: 'Weak rule match',
} as const;

export const CatchUpStory: React.FC<CatchUpStoryProps> = ({ result, onViewSource }) => {
  const beats = buildCatchUpStory(result);

  return (
    <section
      aria-labelledby="catch-up-story-title"
      className="overflow-hidden rounded-2xl border border-[#e3ddd2] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-[#e3ddd2] bg-[#fbfaf7] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
            <BookOpenText className="h-5 w-5" />
          </span>
          <div>
            <h2 id="catch-up-story-title" className="text-lg font-bold tracking-tight text-[#202a35]">
              The short version
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#536170]">
              A few notable moments, in the order they appeared in the chat. Open any source to
              check the original message.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e3ddd2] bg-white px-2.5 py-1 text-xs font-medium text-[#536170]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
          Local, rule-based reading
        </span>
      </div>

      {beats.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[#536170] sm:px-6">
          No notable moments were detected. Try a chat with a clear request, decision, or deadline.
        </p>
      ) : (
        <ol className="divide-y divide-[#eee9e0]">
          {beats.map(({ item, message, label }, index) => (
            <li key={`${item.id}-${message.id}`} className="relative px-5 py-4 sm:px-6">
              <div className="flex gap-3 sm:gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1ece2] font-mono text-xs font-bold text-[#536170]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-[#263442]">{label}</span>
                    <span className="text-xs text-[#667382]">{message.sender}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#667382]">
                      <Clock3 className="h-3 w-3" />
                      {message.timestampRaw || 'Timestamp unavailable'}
                    </span>
                  </div>
                  <blockquote className="mt-2 border-l-2 border-amber-300 pl-3 text-sm leading-relaxed text-[#344252]">
                    “{message.content.trim()}”
                  </blockquote>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      title="Rule-match strength from local heuristics; this is not a probability or a guarantee that the interpretation is correct."
                      className="rounded-full border border-[#e3ddd2] bg-[#fbfaf7] px-2 py-0.5 text-[11px] text-[#536170]"
                    >
                      {CONFIDENCE_LABELS[item.confidence]} · not a probability
                    </span>
                    <span className="text-[11px] text-[#667382]">
                      {item.isExplicit
                        ? 'No suggestion phrasing detected'
                        : 'Suggestion phrasing detected'}
                    </span>
                    {item.deadline?.isAmbiguous && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900">
                        Date needs confirmation
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewSource(message.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#e3ddd2] bg-white px-2.5 py-1 text-xs font-semibold text-[#80500e] transition hover:border-amber-300 hover:bg-amber-50"
                      aria-label={`Open original source message ${message.id}`}
                    >
                      Source {message.id}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="border-t border-[#e3ddd2] px-5 py-3 text-xs leading-relaxed text-[#667382] sm:px-6">
        This is a selection, not a complete transcript. Labels come from local rules, not a
        fact-checker; review the linked messages before acting. Missing timestamps and ambiguous
        dates are not guessed.
      </p>
    </section>
  );
};
