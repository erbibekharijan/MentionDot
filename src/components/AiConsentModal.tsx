import React from 'react';
import { X, Sparkles, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

interface AiConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: string;
}

export const AiConsentModal: React.FC<AiConsentModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121317] border border-[#262830] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1a1b21] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#191a21] border border-[#2b2d37] text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
              Analysis Engine Providers
            </h3>
            <p className="text-xs text-zinc-400">
              Modular architecture supporting local and remote analysis
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-zinc-300">
          <div className="p-3.5 rounded-xl bg-[#17181f] border border-[#2d2f3a]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5 font-mono">
                <Cpu className="w-4 h-4 text-amber-500" />
                Active: Local Heuristic Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                ACTIVE
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-sans">
              Deterministic, explainable rules run in your browser. Chat text is not sent to a server; the page loads fonts from Google Fonts, which receives normal connection metadata but not your conversation content.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#14151a] border border-[#24262d]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Remote AI Provider (e.g. Gemini / Claude)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#1d1f26] text-zinc-400 border border-[#2a2c35] font-semibold font-mono">
                OPTIONAL
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-sans">
              Implements the standard <code className="text-amber-300 font-mono">AnalysisProvider</code> interface for semantic reasoning via a secure server endpoint.
            </p>
            
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="font-sans">
                <span className="font-semibold block">Informed Consent Notice:</span>
                Switching to remote AI requires transmitting conversation text to an external inference endpoint. MISSED. will always ask for explicit confirmation before sending any chat data off-device.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#23242a] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Provider: {activeProvider}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f4f3ee] hover:bg-white text-[#111215] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Stay with Local Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
