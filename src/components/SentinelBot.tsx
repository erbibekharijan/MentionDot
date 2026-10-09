import React, { useState, useEffect } from 'react';

interface SentinelBotProps {
  state?: 'idle' | 'scanning' | 'ready';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIPS = [
  'I extract confirmed commitments — not casual chitchat. Every item links to its exact source message.',
  'Try clicking any [msg-X] reference to see the exact raw message that triggered this item.',
  'Zero data leaves your machine. Every byte lives in volatile browser memory — tab close = full purge.',
  'Mark action items ✓ as you work through your queue. Progress is tracked in the briefing header.',
  'Deadlines marked "uncertain" mean I found a relative date but couldn\'t resolve the exact calendar date — always verify.',
];

export const SentinelBot: React.FC<SentinelBotProps> = ({
  state = 'idle',
  message,
  size = 'md',
  className = '',
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [eyeState, setEyeState] = useState<'open' | 'blink' | 'scan'>('open');
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const targetMessage = message || (
    state === 'scanning'
      ? 'Scanning message stream... parsing entities and deadlines...'
      : state === 'ready'
      ? 'Intelligence briefing ready. Action items require your review.'
      : TIPS[tipIndex]
  );

  // Typewriter effect
  useEffect(() => {
    setIsTyping(true);
    setDisplayText('');
    let i = 0;
    const chars = targetMessage.split('');
    const interval = setInterval(() => {
      if (i < chars.length) {
        setDisplayText(chars.slice(0, i + 1).join(''));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [targetMessage]);

  // Eye animation loop
  useEffect(() => {
    if (state === 'scanning') {
      setEyeState('scan');
      return;
    }
    const loop = setInterval(() => {
      setEyeState('blink');
      setTimeout(() => setEyeState('open'), 180);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(loop);
  }, [state]);

  const dim = size === 'sm' ? 40 : size === 'lg' ? 64 : 52;
  const isDim = size === 'sm';

  const handleClick = () => {
    if (state === 'idle') {
      setTipIndex(i => (i + 1) % TIPS.length);
    }
  };

  return (
    <div className={`flex items-start gap-3.5 ${className}`}>
      {/* ─── Robot Avatar ─── */}
      <button
        type="button"
        onClick={handleClick}
        title={state === 'idle' ? 'Click to cycle tips' : undefined}
        style={{ width: dim, height: dim, flexShrink: 0 }}
        className={`relative rounded-xl flex flex-col items-center justify-between p-1.5 border transition-all duration-300 select-none focus:outline-none ${
          state === 'scanning'
            ? 'bg-[#130f08] border-[#f5a623]/40 scanner-container'
            : state === 'ready'
            ? 'bg-[#081310] border-emerald-500/40'
            : 'bg-[#111114] border-[#252529] hover:border-[#3a3a42] cursor-pointer'
        }`}
      >
        {/* Scanner line overlay when scanning */}
        {state === 'scanning' && <span className="scanner-line" />}

        {/* LED row */}
        <span className="w-full flex items-center justify-between px-0.5">
          <span
            className={`rounded-full transition-colors ${isDim ? 'w-1 h-1' : 'w-1.5 h-1.5'} ${
              state === 'scanning'
                ? 'bg-[#f5a623] animate-pulse'
                : state === 'ready'
                ? 'bg-emerald-400'
                : 'bg-[#f5a623]/70'
            }`}
          />
          <span className="flex gap-px opacity-30">
            {[0,1,2].map(i => (
              <span key={i} className="w-px h-1 rounded-full bg-zinc-400" />
            ))}
          </span>
        </span>

        {/* Eye visor */}
        <span
          className="w-full flex items-center justify-center gap-1 bg-[#080809] rounded-md py-0.5 border border-white/[0.04]"
          style={{ minHeight: isDim ? 10 : 14 }}
        >
          {/* Left eye */}
          <span
            style={{
              width: isDim ? 3 : 4,
              height: eyeState === 'blink' ? 1 : eyeState === 'scan' ? (isDim ? 8 : 12) : (isDim ? 8 : 12),
              borderRadius: 1,
              transition: 'height 0.08s ease',
              display: 'block',
              boxShadow: state === 'scanning'
                ? '0 0 6px rgba(245,166,35,0.9)'
                : state === 'ready'
                ? '0 0 5px rgba(52,211,153,0.8)'
                : '0 0 4px rgba(245,166,35,0.55)',
              background: state === 'scanning' ? '#f5a623'
                : state === 'ready' ? '#34d399'
                : '#f5a623cc',
            }}
          />
          {/* Right eye */}
          <span
            style={{
              width: isDim ? 3 : 4,
              height: eyeState === 'blink' ? 1 : eyeState === 'scan' ? (isDim ? 8 : 12) : (isDim ? 8 : 12),
              borderRadius: 1,
              transition: 'height 0.08s ease',
              display: 'block',
              boxShadow: state === 'scanning'
                ? '0 0 6px rgba(245,166,35,0.9)'
                : state === 'ready'
                ? '0 0 5px rgba(52,211,153,0.8)'
                : '0 0 4px rgba(245,166,35,0.55)',
              background: state === 'scanning' ? '#f5a623'
                : state === 'ready' ? '#34d399'
                : '#f5a623cc',
            }}
          />
        </span>

        {/* Bottom screw accent */}
        <span
          className="rounded-full bg-[#252529]"
          style={{ width: isDim ? 8 : 10, height: 2 }}
        />
      </button>

      {/* ─── Speech ─── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span className="text-zinc-200 font-bold tracking-wide">SENTRY.01</span>
          <span className="text-[#252529]">·</span>
          <span className={
            state === 'scanning' ? 'text-[#f5a623]' :
            state === 'ready' ? 'text-emerald-400' :
            'text-zinc-500'
          }>
            {state === 'scanning' ? 'SCANNING' : state === 'ready' ? 'READY' : 'CHIEF OF STAFF'}
          </span>
        </div>

        <div
          className="text-xs leading-relaxed px-3.5 py-2.5 rounded-xl rounded-tl-sm"
          style={{
            background: '#111114',
            border: '1px solid #1e1e24',
            color: '#c8c4bb',
            fontFamily: 'var(--font-sans)',
            maxWidth: 480,
          }}
        >
          {displayText}
          {isTyping && <span className="text-[#f5a623] animate-tick">▋</span>}
        </div>
      </div>
    </div>
  );
};
