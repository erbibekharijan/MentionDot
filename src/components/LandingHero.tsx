import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Target,
  Clock,
  Lock,
  Cpu,
  Flame,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { SentinelBot } from './SentinelBot';

interface LandingHeroProps {
  onExploreDemo: () => void;
  onScrollToInput: () => void;
  onOpenPrivacy: () => void;
}

const METRICS = [
  { label: 'Messages parsed', value: '40+', suffix: '' },
  { label: 'Avg. items surfaced', value: '5', suffix: '' },
  { label: 'Data sent to cloud', value: '0', suffix: 'bytes' },
  { label: 'Processing time', value: '<1', suffix: 's' },
];

const PREVIEW_RAW = [
  { time: '09:00', sender: 'Alex', text: 'Good morning team! Quick sprint check?', highlight: false },
  { time: '09:12', sender: 'Sarah', text: 'Coffee run in 10 mins who\'s coming', highlight: false },
  { time: '09:22', sender: 'Alex', text: 'URGENT: Production API rate limit 429s on ingestion!', highlight: 'rose' as const },
  { time: '09:25', sender: 'Carlos', text: 'On it, jumping into AWS console...', highlight: false },
  { time: '09:34', sender: 'Carlos', text: 'Fixed. Bumped Redis buffer. Resolved.', highlight: false },
  { time: '09:50', sender: 'Priya', text: 'Submit final financial deck by Friday 5 PM — hard deadline.', highlight: 'amber' as const },
  { time: '10:18', sender: 'Alex', text: 'Bibek, can you patch the auth handler before deploy tonight?', highlight: 'amber' as const },
  { time: '10:38', sender: 'Carlos', text: 'Final decision: Tailwind v4 for ProtocolX frontend. Ship it.', highlight: false },
];

const PREVIEW_DISTILLED = [
  {
    label: 'URGENT ACTION',
    color: '#fb7185',
    bg: 'rgba(251,113,133,0.06)',
    border: 'rgba(251,113,133,0.2)',
    title: 'Production 429s — Redis buffer bumped by Carlos',
    why: 'High-impact ingestion incident. Resolved 09:34.',
    ref: 'msg-3',
  },
  {
    label: 'DEADLINE · FRI 5 PM',
    color: '#f5a623',
    bg: 'rgba(245,166,35,0.06)',
    border: 'rgba(245,166,35,0.2)',
    title: 'Submit quarterly financial deck for leadership',
    why: 'Hard cutoff explicitly stated by Priya.',
    ref: 'msg-6',
  },
  {
    label: 'ASSIGNED TO YOU',
    color: '#f5a623',
    bg: 'rgba(245,166,35,0.06)',
    border: 'rgba(245,166,35,0.2)',
    title: 'Patch auth handler before tonight\'s deploy',
    why: 'Direct assignment from Alex to Bibek.',
    ref: 'msg-7',
  },
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onExploreDemo,
  onScrollToInput,
  onOpenPrivacy,
}) => {
  const [activeTab, setActiveTab] = useState<'distilled' | 'raw'>('distilled');
  const [metricIndex, setMetricIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricIndex(i => (i + 1) % METRICS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-grain">
      {/* ── Hero ── */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center overflow-hidden">
        {/* Ambient glow orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Privacy pill */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-10 transition-all animate-fade-up"
          style={{
            background: '#111114',
            border: '1px solid #1e1e24',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
          <span style={{ color: '#6b7280' }}>VERIFIED:</span>
          <span style={{ color: '#f0ede8' }}>100% IN-BROWSER AIRGAP</span>
          <span style={{ color: '#252529' }}>/</span>
          <span style={{ color: '#6b7280' }} className="hidden sm:inline">ZERO SERVER TRANSMISSION</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="transition-colors"
            style={{ color: '#f5a623', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            verify
          </button>
        </div>

        {/* SentinelBot greeting */}
        <div
          className="max-w-lg mx-auto mb-12 text-left p-4 rounded-2xl transition-all animate-fade-up"
          style={{
            background: '#111114',
            border: '1px solid #1e1e24',
            animationDelay: '0.08s',
          }}
        >
          <SentinelBot
            state="idle"
            message="Drop unread team chats or a .txt export. I'll surface decisions, deadlines, and assignments — zero data leaves your machine."
          />
        </div>

        {/* Headline */}
        <h1
          className="font-black leading-[1.08] tracking-tight mb-6 animate-fade-up"
          style={{
            fontSize: 'clamp(36px, 6vw, 68px)',
            fontFamily: 'var(--font-sans)',
            animationDelay: '0.12s',
          }}
        >
          <span style={{ color: '#f0ede8' }}>Hundreds of messages.</span>
          <br />
          <span
            className="text-shimmer"
            style={{ fontSize: 'clamp(34px, 5.5vw, 64px)' }}
          >
            Five things that matter.
          </span>
        </h1>

        <p
          className="max-w-xl mx-auto mb-10 animate-fade-up"
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: '#6b7280',
            fontFamily: 'var(--font-sans)',
            animationDelay: '0.18s',
          }}
        >
          Your personal conversation intelligence inbox. Surfaces missed decisions, urgent tasks, and deadlines — entirely in your browser.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fade-up"
          style={{ animationDelay: '0.22s' }}
        >
          <button
            type="button"
            onClick={onScrollToInput}
            className="hover-lift w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all focus-ring"
            style={{
              background: '#f0ede8',
              color: '#0a0a0b',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          >
            <span>Catch me up</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onExploreDemo}
            className="hover-lift w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all focus-ring"
            style={{
              background: '#111114',
              border: '1px solid #252529',
              color: '#c8c4bb',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#f5a623' }} />
            <span>Explore demo (40+ msgs)</span>
          </button>
        </div>

        {/* Scenario shortcuts */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 animate-fade-up"
          style={{ animationDelay: '0.28s' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#3a3a42',
              letterSpacing: '0.1em',
            }}
          >
            SCENARIOS:
          </span>
          {[
            { icon: <Flame className="w-3 h-3" style={{ color: '#fb7185' }} />, label: 'Redis 429 Outage' },
            { icon: <Clock className="w-3 h-3" style={{ color: '#f5a623' }} />, label: 'Sprint Deck Friday' },
            { icon: <TrendingUp className="w-3 h-3" style={{ color: '#34d399' }} />, label: 'Tailwind v4 Decision' },
          ].map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={onExploreDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all focus-ring"
              style={{
                background: '#111114',
                border: '1px solid #1e1e24',
                color: '#6b7280',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Live Metrics Ticker ── */}
      <div
        className="max-w-4xl mx-auto px-4 mb-16"
        style={{ animationDelay: '0.3s' }}
      >
        <div
          className="rounded-xl px-5 py-3 flex items-center gap-6 overflow-hidden"
          style={{ background: '#111114', border: '1px solid #1e1e24' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#3a3a42',
              letterSpacing: '0.1em',
              flexShrink: 0,
            }}
          >
            METRICS
          </span>
          <div className="section-divider" style={{ width: 1, height: 20, background: '#1e1e24', flexShrink: 0 }} />
          <div className="flex items-center gap-8 overflow-x-auto">
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className="flex flex-col items-center shrink-0 transition-all duration-500"
                style={{ opacity: i === metricIndex ? 1 : 0.35 }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: i === metricIndex ? '#f5a623' : '#f0ede8',
                    lineHeight: 1,
                  }}
                >
                  {m.value}<span style={{ fontSize: 11, color: '#6b7280', marginLeft: 2 }}>{m.suffix}</span>
                </span>
                <span style={{ fontSize: 10, color: '#5c5955', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Interactive Preview ── */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111114', border: '1px solid #1e1e24' }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid #1e1e24', background: '#0d0d0f' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#fb7185' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f5a623' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#34d399' }} />
              <span
                className="ml-3"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3a3a42' }}
              >
                MISSED. — SIGNAL DISTILLATION PREVIEW
              </span>
            </div>

            {/* Tab switcher */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ background: '#0a0a0b', border: '1px solid #1e1e24' }}
            >
              {(['distilled', 'raw'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="px-3 py-1 rounded-md transition-all text-xs font-semibold focus-ring"
                  style={{
                    background: activeTab === tab ? '#1e1e24' : 'transparent',
                    color: activeTab === tab ? '#f0ede8' : '#5c5955',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.05em',
                  }}
                >
                  {tab === 'distilled' ? 'DISTILLED (3 ITEMS)' : 'RAW STREAM (40+ MSGS)'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {activeTab === 'distilled' ? (
              <div className="space-y-3">
                {PREVIEW_DISTILLED.map((item, i) => (
                  <div
                    key={item.ref}
                    className={`p-4 rounded-xl hover-lift card-${i + 1}`}
                    style={{
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      borderLeft: `3px solid ${item.color}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: item.color,
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: '#3a3a42',
                          background: '#0a0a0b',
                          border: '1px solid #1e1e24',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {item.ref}
                      </span>
                    </div>
                    <p
                      className="font-semibold mb-1"
                      style={{ fontSize: 13, color: '#f0ede8', fontFamily: 'var(--font-sans)' }}
                    >
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-sans)' }}>
                      <span style={{ color: '#f5a623', fontWeight: 500 }}>Why it matters: </span>
                      {item.why}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto"
                style={{ background: '#0a0a0b', border: '1px solid #1e1e24' }}
              >
                {PREVIEW_RAW.map((msg) => (
                  <div
                    key={`${msg.time}-${msg.sender}`}
                    className="flex gap-3 items-start"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  >
                    <span style={{ color: '#3a3a42', flexShrink: 0 }}>[{msg.time}]</span>
                    <span style={{ color: '#5c5955', flexShrink: 0 }}>{msg.sender}:</span>
                    <span
                      style={{
                        color: msg.highlight === 'rose' ? '#fb7185'
                          : msg.highlight === 'amber' ? '#f5a623'
                          : '#6b7280',
                        fontWeight: msg.highlight ? 600 : 400,
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3a3a42', paddingTop: 4 }}>
                  ... +32 more messages in thread
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Feature Pillars ── */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Target className="w-4 h-4" />,
              accent: '#f5a623',
              tag: 'FOCUS',
              title: 'Know what needs your attention.',
              body: 'Extracts direct mentions, urgent requests, and assignments directed specifically at you. Separates explicit commitments from casual suggestions.',
            },
            {
              icon: <Clock className="w-4 h-4" />,
              accent: '#f5a623',
              tag: 'CHRONOLOGY',
              title: 'Find decisions and deadlines instantly.',
              body: 'Surfaces calendar shifts, tech choices, and cutoffs chronologically. Unresolved dates are honestly marked uncertain — never hallucinated.',
            },
            {
              icon: <Lock className="w-4 h-4" />,
              accent: '#34d399',
              tag: 'PRIVACY',
              title: 'Keep your conversations private.',
              body: 'Runs 100% locally in your browser. No backend databases or chat telemetry. Conversation data stays in memory; only the optional tour preference is saved locally.',
            },
          ].map(({ icon, accent, tag, title, body }) => (
            <div
              key={tag}
              className="p-5 rounded-2xl hover-lift transition-all"
              style={{ background: '#111114', border: '1px solid #1e1e24' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#0d0d0f', border: '1px solid #1e1e24', color: accent }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: '#3a3a42',
                    letterSpacing: '0.12em',
                  }}
                >
                  {tag}
                </span>
              </div>
              <h3
                className="font-bold mb-2"
                style={{ fontSize: 14, color: '#f0ede8', fontFamily: 'var(--font-sans)' }}
              >
                {title}
              </h3>
              <p style={{ fontSize: 12, color: '#5c5955', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audit Banner ── */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div
          className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: '#111114', border: '1px solid #1e1e24' }}
        >
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f5a623' }} />
            <div>
              <p
                className="font-semibold mb-0.5"
                style={{ fontSize: 13, color: '#f0ede8', fontFamily: 'var(--font-sans)' }}
              >
                Deterministic Local Heuristics · Zero Black-Box Hallucination
              </p>
              <p style={{ fontSize: 11, color: '#5c5955', fontFamily: 'var(--font-sans)' }}>
                Explainable mathematical priority rules with direct message citations. No LLM APIs called — ever.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPrivacy}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover-lift focus-ring"
            style={{
              background: '#0d0d0f',
              border: '1px solid #252529',
              fontSize: 12,
              color: '#a8a49c',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: '#34d399' }} />
            <span>Verify Privacy Architecture</span>
          </button>
        </div>
      </div>
    </div>
  );
};
