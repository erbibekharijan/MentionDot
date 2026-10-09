import React, { useState, useRef, useId, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Trash2,
  HelpCircle,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Keyboard,
  AtSign,
} from 'lucide-react';
import type { UserConfig } from '../types';
import { SentinelBot } from './SentinelBot';

interface InputSectionProps {
  rawText: string;
  onChangeText: (text: string) => void;
  userConfig: UserConfig;
  onChangeUserConfig: (config: UserConfig) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
  messageCount: number;
}

export const InputSection: React.FC<InputSectionProps> = ({
  rawText,
  onChangeText,
  userConfig,
  onChangeUserConfig,
  onAnalyze,
  onLoadSample,
  onClear,
  isAnalyzing,
  messageCount,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputId = useId();

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to run analysis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (rawText.trim() && !isAnalyzing) {
          e.preventDefault();
          onAnalyze();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rawText, isAnalyzing, onAnalyze]);

  const handleFileUpload = (file: File | undefined) => {
    setUploadError(null);
    if (!file) return;
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setUploadError('Please select a valid .txt or .md plain text export file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
        setActiveTab('paste');
      }
    };
    reader.onerror = () => setUploadError('Failed to read file from disk.');
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleAliasesChange = (val: string) => {
    const list = val.split(',').map((s) => s.trim()).filter(Boolean);
    onChangeUserConfig({ ...userConfig, aliases: list });
  };

  const inputStyle = {
    background: '#0a0a0b',
    border: '1px solid #1e1e24',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#c8c4bb',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  return (
    <div id="input-section" className="max-w-4xl mx-auto px-4 pb-20">
      {/* Sentinel Bot bubble */}
      <div
        className="mb-5 p-4 rounded-2xl"
        style={{ background: '#111114', border: '1px solid #1e1e24' }}
      >
        <SentinelBot
          state={isAnalyzing ? 'scanning' : rawText ? 'ready' : 'idle'}
          message={
            isAnalyzing
              ? 'Analyzing syntax, parsing relative deadlines, and isolating direct requests...'
              : rawText
              ? `Buffer loaded — ${messageCount} messages detected. Press "Catch me up" or use Ctrl+Enter.`
              : 'Intelligence Dropzone ready. Paste WhatsApp / Slack logs or drop a .txt export file here.'
          }
        />
      </div>

      {/* Main Input Panel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111114', border: '1px solid #1e1e24' }}
      >
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid #1e1e24', background: '#0d0d0f' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#f5a623' }}
              />
              <h2
                className="font-bold"
                style={{ fontSize: 14, color: '#f0ede8', fontFamily: 'var(--font-sans)' }}
              >
                Conversation Input Terminal
              </h2>
            </div>
            <p style={{ fontSize: 11, color: '#5c5955', fontFamily: 'var(--font-sans)' }}>
              WhatsApp · Slack · Discord · Markdown — 100% in-browser
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: '#0a0a0b', border: '1px solid #1e1e24' }}
          >
            {(['paste', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all focus-ring"
                style={{
                  background: activeTab === tab ? '#1e1e24' : 'transparent',
                  color: activeTab === tab ? '#f0ede8' : '#5c5955',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeTab === tab ? 700 : 400,
                  letterSpacing: '0.04em',
                }}
              >
                {tab === 'upload' && <Upload className="w-3 h-3" />}
                {tab === 'paste' ? 'PASTE STREAM' : '.TXT / .MD'}
              </button>
            ))}
          </div>
        </div>

        {/* User Config */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid #1e1e24', background: '#0d0d0f' }}
        >
          <div>
            <label
              className="flex items-center gap-1.5 mb-1.5"
              style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}
            >
              <User className="w-3 h-3" style={{ color: '#f5a623' }} />
              YOUR NAME (mention detection)
            </label>
            <input
              type="text"
              value={userConfig.userName}
              onChange={(e) => onChangeUserConfig({ ...userConfig, userName: e.target.value })}
              placeholder="e.g. Bibek, Denzo"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = '#1e1e24')}
            />
          </div>

          <div>
            <label
              className="flex items-center gap-1.5 mb-1.5"
              style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}
            >
              <AtSign className="w-3 h-3" style={{ color: '#f5a623' }} />
              ALIASES (comma-separated)
            </label>
            <input
              type="text"
              value={userConfig.aliases.join(', ')}
              onChange={(e) => handleAliasesChange(e.target.value)}
              placeholder="e.g. bibek, @bibek, bib"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = '#1e1e24')}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'paste' ? (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className="relative"
                style={{
                  borderRadius: 12,
                  ...(isDragOver ? { outline: '2px solid rgba(245,166,35,0.6)', outlineOffset: 2 } : {}),
                }}
              >
                <textarea
                  value={rawText}
                  onChange={(e) => onChangeText(e.target.value)}
                  placeholder={`Paste your conversation here...

Example formats:
[09/10/2026, 10:30] Alex: Meeting moved to 3 PM.
[09/10/2026, 10:35] Priya: Submit the report by Friday.
Bibek, can you verify the staging server?`}
                  rows={11}
                  style={{
                    width: '100%',
                    background: '#0a0a0b',
                    border: '1px solid #1e1e24',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 12,
                    color: '#c8c4bb',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.8,
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e1e24')}
                />

                {isDragOver && (
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{
                      background: 'rgba(10,10,11,0.92)',
                      border: '2px dashed rgba(245,166,35,0.5)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#f0ede8',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Drop file to load conversation
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div
                  className="flex items-center gap-4"
                  style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#5c5955' }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                    <span style={{ color: '#c8c4bb', fontWeight: 600 }}>{rawText.length.toLocaleString()}</span> chars
                  </span>
                  <span>·</span>
                  <span>
                    <span style={{ color: '#f5a623', fontWeight: 600 }}>{messageCount}</span> messages
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="inline-flex items-center gap-1 transition-colors"
                    style={{ fontSize: 11, color: '#5c5955', fontFamily: 'var(--font-sans)' }}
                  >
                    <HelpCircle className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
                    Format Guide
                  </button>

                  {rawText && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="inline-flex items-center gap-1 transition-colors"
                      style={{ fontSize: 11, color: '#5c5955', fontFamily: 'var(--font-sans)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Upload Tab */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className="py-14 px-4 text-center rounded-2xl transition-all"
              style={{
                border: `2px dashed ${isDragOver ? 'rgba(245,166,35,0.5)' : '#1e1e24'}`,
                background: isDragOver ? 'rgba(245,166,35,0.04)' : '#0a0a0b',
              }}
            >
              <input
                id={fileUploadInputId}
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="hidden"
              />
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#111114', border: '1px solid #1e1e24' }}
              >
                <Upload className="w-5 h-5" style={{ color: '#f5a623' }} />
              </div>
              <h3
                className="font-bold mb-2"
                style={{ fontSize: 14, color: '#f0ede8', fontFamily: 'var(--font-sans)' }}
              >
                Drop conversation export here
              </h3>
              <p
                className="mb-6 max-w-xs mx-auto"
                style={{ fontSize: 12, color: '#5c5955', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}
              >
                WhatsApp exports, Slack / Discord transcripts, or Markdown logs (.txt or .md)
              </p>
              <label
                htmlFor={fileUploadInputId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer hover-lift focus-ring"
                style={{
                  background: '#1e1e24',
                  border: '1px solid #252529',
                  color: '#c8c4bb',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <FileText className="w-4 h-4" style={{ color: '#f5a623' }} />
                Browse Local Files
              </label>

              {uploadError && (
                <div
                  className="mt-4 p-3 rounded-xl flex items-center justify-center gap-2 max-w-sm mx-auto"
                  style={{
                    background: 'rgba(251,113,133,0.08)',
                    border: '1px solid rgba(251,113,133,0.25)',
                    color: '#fb7185',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Format Guide Drawer */}
          {showFormatGuide && (
            <div
              className="mt-4 p-4 rounded-xl animate-fade-in"
              style={{ background: '#0a0a0b', border: '1px solid #1e1e24' }}
            >
              <div
                className="flex items-center gap-1.5 mb-3"
                style={{ fontSize: 12, color: '#c8c4bb', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
              >
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                Supported Message Formats
              </div>
              <ul
                className="space-y-1.5"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5c5955', listStyle: 'disc', paddingLeft: 16 }}
              >
                <li><code style={{ color: '#f5a623' }}>[09/10/2026, 10:30] Alex: Meeting moved to 3 PM.</code></li>
                <li><code style={{ color: '#f5a623' }}>09:30 - Priya: Please submit the form by Friday.</code></li>
                <li><code style={{ color: '#f5a623' }}>09/10/2026, 10:30 - Priya: Task deadline tomorrow.</code></li>
                <li><code style={{ color: '#f5a623' }}>Alex: I&apos;ll send the slides tonight.</code></li>
              </ul>
            </div>
          )}

          {/* Action Row */}
          <div
            className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1e1e24' }}
          >
            <button
              type="button"
              onClick={onLoadSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all hover-lift focus-ring"
              style={{
                background: '#0d0d0f',
                border: '1px solid #1e1e24',
                color: '#6b7280',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
              Load 40+ Message Demo
            </button>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <span
                className="hidden sm:inline-flex items-center gap-1"
                style={{ fontSize: 11, color: '#3a3a42', fontFamily: 'var(--font-mono)' }}
              >
                <Keyboard className="w-3 h-3" /> Ctrl+Enter
              </span>

              <button
                type="button"
                onClick={onAnalyze}
                disabled={!rawText.trim() || isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all focus-ring hover-lift"
                style={{
                  background: !rawText.trim() || isAnalyzing ? '#111114' : '#f0ede8',
                  border: !rawText.trim() || isAnalyzing ? '1px solid #1e1e24' : 'none',
                  color: !rawText.trim() || isAnalyzing ? '#3a3a42' : '#0a0a0b',
                  cursor: !rawText.trim() || isAnalyzing ? 'not-allowed' : 'pointer',
                  opacity: !rawText.trim() || isAnalyzing ? 0.5 : 1,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span
                      className="animate-spin-slow"
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderTopColor: '#0a0a0b',
                        borderRadius: '50%',
                        display: 'block',
                      }}
                    />
                    Analyzing locally...
                  </>
                ) : (
                  <>
                    Catch me up
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
