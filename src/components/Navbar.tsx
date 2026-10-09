import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, Cpu, BookOpenCheck } from 'lucide-react';

interface NavbarProps {
  onOpenPrivacy: () => void;
  onOpenAiModal: () => void;
  onReset: () => void;
  onReplayTour: () => void;
  hasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPrivacy,
  onOpenAiModal,
  onReset,
  onReplayTour,
  hasData,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        borderBottom: scrolled ? '1px solid #1e1e24' : '1px solid transparent',
        background: scrolled ? 'rgba(10,10,11,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          {/* Logo Mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm select-none transition-transform hover:scale-105"
            style={{
              background: '#f0ede8',
              color: '#0a0a0b',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              letterSpacing: '-0.02em',
              boxShadow: '0 0 0 1px rgba(240,237,232,0.15)',
            }}
          >
            M.
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: '-0.02em',
                  color: '#f0ede8',
                }}
              >
                MISSED<span style={{ color: '#f5a623' }}>.</span>
              </span>

              {/* Protocol X badge */}
              <span
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                style={{
                  background: '#111114',
                  border: '1px solid #252529',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: '#5c5955',
                  letterSpacing: '0.1em',
                }}
              >
                <span
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ background: '#f5a623' }}
                />
                PROTOCOL X
              </span>
            </div>

            <p
              className="hidden md:block"
              style={{ fontSize: 10, color: '#5c5955', marginTop: -1, fontFamily: 'var(--font-sans)' }}
            >
              Catch up on what matters. Keep your chats yours.
            </p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={onReplayTour}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all focus-ring"
            style={{
              background: '#111114',
              border: '1px solid #1e1e24',
              fontSize: 11,
              color: '#a8a49c',
              fontFamily: 'var(--font-mono)',
            }}
            title="Replay the guided product tour"
          >
            <BookOpenCheck className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
            <span>TOUR</span>
          </button>

          {/* Privacy badge */}
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all focus-ring"
            style={{
              background: '#111114',
              border: '1px solid #1e1e24',
              fontSize: 11,
              color: '#a8a49c',
              fontFamily: 'var(--font-mono)',
            }}
            title="Click to view verified privacy architecture"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#34d399' }}
            />
            <span className="hidden sm:inline" style={{ color: '#6b7280' }}>IN-BROWSER</span>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
          </button>

          {/* Engine info */}
          <button
            type="button"
            onClick={onOpenAiModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all focus-ring"
            style={{
              background: '#111114',
              border: '1px solid #1e1e24',
              fontSize: 11,
              color: '#a8a49c',
              fontFamily: 'var(--font-mono)',
            }}
            title="Engine Architecture"
          >
            <Cpu className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
            <span>ENGINE</span>
          </button>

          {/* Reset */}
          {hasData && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all focus-ring"
              style={{
                background: '#111114',
                border: '1px solid #1e1e24',
                fontSize: 11,
                color: '#a8a49c',
                fontFamily: 'var(--font-mono)',
              }}
              title="Clear the current conversation and briefing. Your tutorial preference is kept."
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">CLEAR</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
