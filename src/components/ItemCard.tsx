import React from 'react';
import type { ExtractedItem, PriorityLevel } from '../types';
import {
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ItemCardProps {
  item: ExtractedItem;
  onToggleComplete?: (id: string) => void;
  onViewSource: (messageId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onToggleComplete,
  onViewSource,
}) => {
  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            URGENT
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            HIGH
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#1e2027] text-zinc-300 border border-[#2d2f38]">
            NORMAL
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#17181d] text-zinc-400 border border-[#26282f]">
            LOW
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 p-4.5 ${
        item.isCompleted
          ? 'bg-[#101114]/50 border-[#1f2026] opacity-60'
          : item.priority === 'urgent'
          ? 'bg-[#151316] border-rose-500/30 hover:border-rose-500/60 shadow-sm'
          : 'bg-[#131418] border-[#24262d] hover:border-[#383a44] shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3.5">
        {/* Every briefing item can be checked off, regardless of category. */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            data-tour="completion-toggle"
            onClick={() => onToggleComplete?.(item.id)}
            disabled={!onToggleComplete}
            aria-pressed={Boolean(item.isCompleted)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              onToggleComplete ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              item.isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-black shadow-sm'
                : 'border-[#3a3c46] hover:border-emerald-400 bg-[#1c1d24]'
            }`}
            title={item.isCompleted ? 'Mark as open' : 'Mark as completed'}
            aria-label={item.isCompleted ? 'Mark as open' : 'Mark as completed'}
          >
            {item.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />}
          </button>
        </div>

        {/* Center: Title & Sender */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {getPriorityBadge(item.priority)}
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 font-mono">
              <span className="text-zinc-200 font-semibold">{item.sender}</span>
              {item.timestamp && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 text-[11px]">{item.timestamp}</span>
                </>
              )}
            </span>
            {item.isExplicit ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1b1c22] text-zinc-300 border border-[#2b2d37]" title="The source message states this directly.">
                EXPLICIT
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20" title="This label is a rule-based interpretation of the source message.">
                INFERRED
              </span>
            )}
            <span
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#fbfaf7] text-[#536170] border border-[#e3ddd2]"
              title="Rule-match strength from local heuristics; this is not a probability that the finding is correct."
            >
              {item.confidence.toUpperCase()} RULE MATCH
            </span>
          </div>

          <h4
            className={`text-sm font-semibold tracking-tight leading-snug ${
              item.isCompleted ? 'line-through text-zinc-500' : 'text-[#f4f3ee]'
            }`}
          >
            {item.title}
          </h4>

          {/* Why this matters explanation */}
          <div className="mt-2.5 text-xs bg-[#0c0d10] border border-[#22242a] rounded-lg p-2.5 text-zinc-300">
            <span className="text-amber-400 font-semibold mr-1.5 font-mono text-[11px]">WHY THIS MATTERS:</span>
            <span className="font-sans leading-relaxed text-zinc-300">{item.explanation}</span>
            {item.deadline?.isAmbiguous && (
              <span className="block mt-1 text-amber-700">
                Date is ambiguous; verify it against the original conversation.
              </span>
            )}
          </div>

          {/* Deadline pill if present */}
          {item.deadline && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-medium border font-mono ${
                  item.deadline.status === 'overdue'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                    : item.deadline.status === 'due_today'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                    : item.deadline.status === 'uncertain'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/35'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{item.deadline.dateStr}</span>
                <span className="uppercase text-[10px] opacity-75">[{item.deadline.status.replace('_', ' ')}]</span>
              </span>
              {item.deadline.ambiguityReason && (
                <span className="text-[11px] text-zinc-500 italic">
                  {item.deadline.ambiguityReason}
                </span>
              )}
            </div>
          )}

          {/* Original Source Quote with Tactical Jump Action */}
          <div className="mt-3 flex items-start gap-2 pt-2.5 border-t border-[#22242a] text-xs text-zinc-400">
            <span className="italic flex-1 font-sans text-zinc-400 select-text">
              "{item.sourceMessageExcerpt}"
            </span>
            <button
              type="button"
              onClick={() => onViewSource(item.sourceMessageId)}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber-300 hover:text-white bg-[#1a1b22] hover:bg-[#242630] border border-[#2f313c] px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0"
              title={`Inspect message ${item.sourceMessageId} in raw stream`}
            >
              <span>{item.sourceMessageId}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
