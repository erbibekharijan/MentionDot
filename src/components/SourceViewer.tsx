import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';
import { X, Search, Clock, User, ArrowDownCircle, Check, Copy } from 'lucide-react';

interface SourceViewerProps {
  messages: Message[];
  highlightedId: string | null;
  onClose: () => void;
  isOpen: boolean;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  messages,
  highlightedId,
  onClose,
  isOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightedId && isOpen && itemRefs.current[highlightedId]) {
      itemRefs.current[highlightedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedId, isOpen]);

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.sender.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[560px] bg-[#0c0d10] border-l border-[#24262d] shadow-2xl flex flex-col transition-transform duration-300 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4.5 border-b border-[#23242a] flex items-center justify-between bg-[#121317]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="font-bold text-[#f4f3ee] text-sm font-mono tracking-tight">
              SOURCE_EVIDENCE_DRAWER
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            {messages.length} raw verified messages residing in volatile memory
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2027] transition-colors cursor-pointer"
          aria-label="Close Source Inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#23242a] bg-[#14151a]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw chat messages or sender..."
            className="w-full bg-[#0c0d10] border border-[#25272e] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            No messages matching "{searchQuery}"
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isTarget = msg.id === highlightedId;
            return (
              <div
                key={msg.id}
                ref={(el) => {
                  itemRefs.current[msg.id] = el;
                }}
                className={`p-4 rounded-xl border transition-all text-xs relative ${
                  isTarget
                    ? 'bg-[#1a1b22] border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-[#121317] border-[#23242a] hover:border-[#32343c]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-200 font-mono">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>{msg.sender}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    {msg.timestampRaw && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {msg.timestampRaw}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isTarget
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'bg-[#1b1c22] text-zinc-400 border border-[#2a2c35]'
                      }`}
                    >
                      {msg.id}
                    </span>
                  </div>
                </div>

                {isTarget && (
                  <div className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 font-mono">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>LINKED EVIDENCE ANCHOR</span>
                  </div>
                )}

                <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap select-text font-sans">
                  {msg.content}
                </p>

                {/* Micro Action to copy text */}
                <div className="mt-2.5 pt-2 border-t border-[#23242a] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopyText(msg.id, msg.content)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Quote</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-[#23242a] bg-[#121317] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
        <span>Grounded in unmodified source text</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          VERIFIED
        </span>
      </div>
    </div>
  );
};
