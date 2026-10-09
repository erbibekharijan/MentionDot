import React from 'react';
import { X, ShieldCheck, Lock, HardDrive, Cpu, EyeOff, ServerOff, FileCheck } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121317] border border-[#262830] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-left">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1a1b21] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#191a21] border border-[#2b2d37] text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
              Privacy Architecture Guarantee
            </h3>
            <p className="text-xs text-zinc-400">
              Technical privacy, verified by code — not marketing claims.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#16171d] border border-[#23252c]">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#f4f3ee]">100% In-Browser Execution</div>
              <p className="text-zinc-400 mt-0.5">
                Every parser rule, date evaluator, priority score, and heuristic runs strictly in your local JavaScript runtime. Your conversation text never leaves your device.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#16171d] border border-[#23252c]">
            <ServerOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#f4f3ee]">Zero Cloud Databases & Backend Servers</div>
              <p className="text-zinc-400 mt-0.5">
                MISSED. does not connect to Supabase, Firebase, or any cloud database for message storage. It is built as a static frontend deployed on Vercel.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#16171d] border border-[#23252c]">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#f4f3ee]">Ephemeral In-Memory React State</div>
              <p className="text-zinc-400 mt-0.5">
                Pasted text, uploaded files, analysis, and checklist changes stay in transient memory; chat content is never written to `localStorage` or `IndexedDB`. A single `localStorage` flag remembers that you started or skipped the optional guided demo. “Clear Data” and closing the tab erase the current chat and briefing, but keep that preference so the welcome does not return.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#16171d] border border-[#23252c]">
            <Cpu className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#f4f3ee]">Local Heuristics vs. Remote AI</div>
              <p className="text-zinc-400 mt-0.5">
                We clearly label our engine as deterministic heuristic analysis. We do not claim local LLM inference when running browser rules.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#16171d] border border-[#23252c]">
            <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#f4f3ee]">No Content Telemetry or Tracking</div>
              <p className="text-zinc-400 mt-0.5">
                No third-party trackers, session replay tools, or error reporters receive any text excerpts.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-[#23252c] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Open Source & Fully Auditable</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#f4f3ee] hover:bg-white text-[#111215] text-xs font-semibold transition-colors cursor-pointer"
          >
            Got it, proceed
          </button>
        </div>
      </div>
    </div>
  );
};
