import React, { useState, useMemo } from 'react';
import type {
  AnalysisResult,
  PriorityLevel,
} from '../types';
import { ItemCard } from './ItemCard';
import { CatchUpStory } from './CatchUpStory';
import { SourceViewer } from './SourceViewer';
import { formatAsMarkdown, formatAsPlainText, downloadFile } from '../utils/exporter';
import { SentinelBot } from './SentinelBot';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MessageSquare,
  HelpCircle,
  FileText,
  Search,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  ExternalLink,
  Milestone,
  ShieldCheck,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onUpdateResult: (updated: AnalysisResult) => void;
  onReset: () => void;
  onOpenPrivacy: () => void;
}

type FilterTab = 'all' | 'urgent' | 'task' | 'deadline' | 'decision' | 'mention' | 'question' | 'update' | 'completed';
type SortOption = 'priority' | 'chronological' | 'sender';

export const Dashboard: React.FC<DashboardProps> = ({
  result,
  onUpdateResult,
  onReset,
  onOpenPrivacy,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sourceViewerOpen, setSourceViewerOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Toggle item completion
  const handleToggleComplete = (itemId: string) => {
    const updatedItems = result.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, isCompleted: !item.isCompleted };
      }
      return item;
    });

    const completedCount = updatedItems.filter((i) => i.isCompleted).length;
    onUpdateResult({
      ...result,
      items: updatedItems,
      stats: {
        ...result.stats,
        completedCount,
      },
    });
  };

  // Open source viewer with focused message
  const handleViewSource = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setSourceViewerOpen(true);
  };

  // Copy Executive Summary
  const handleCopySummary = () => {
    const text = `MISSED. Executive Summary:\n${result.summary.map((b) => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Export handlers
  const handleExportMarkdown = () => {
    const md = formatAsMarkdown(result);
    downloadFile(md, `missed-briefing-${Date.now()}.md`, 'text/markdown');
  };

  const handleExportPlainText = () => {
    const txt = formatAsPlainText(result);
    downloadFile(txt, `missed-briefing-${Date.now()}.txt`, 'text/plain');
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return result.items
      .filter((item) => {
        if (activeFilter === 'urgent') return item.priority === 'urgent';
        if (activeFilter === 'completed') return item.isCompleted;
        if (activeFilter !== 'all') return item.category === activeFilter;
        return true;
      })
      .filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q) ||
          item.sender.toLowerCase().includes(q) ||
          item.sourceMessageExcerpt.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const weights: Record<PriorityLevel, number> = {
            urgent: 4,
            high: 3,
            normal: 2,
            low: 1,
          };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortBy === 'sender') {
          return a.sender.localeCompare(b.sender);
        }
        const idA = parseInt(a.sourceMessageId.replace('msg-', ''), 10) || 0;
        const idB = parseInt(b.sourceMessageId.replace('msg-', ''), 10) || 0;
        return idA - idB;
      });
  }, [result.items, activeFilter, searchQuery, sortBy]);

  // Grouped items
  const actNowItems = result.items.filter(
    (i) => i.priority === 'urgent' || (i.category === 'task' && !i.isCompleted)
  );
  const deadlineItems = result.items.filter((i) => i.category === 'deadline');
  const decisionItems = result.items.filter((i) => i.category === 'decision');
  const mentionItems = result.items.filter((i) => i.category === 'mention');
  const waitingOnItems = result.items.filter(
    (i) => i.category === 'question' && i.isWaitingOn
  );
  const updateItems = result.items.filter((i) => i.category === 'update');

  const botBriefingMessage = `Read ${result.stats.totalMessages} messages locally. I found ${result.stats.urgentCount} urgent signals, ${result.stats.deadlineCount} deadline mentions, and ${result.stats.decisionCount} messages matching decision language. Check each linked message before acting.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#23242a]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#181920] border border-[#2b2d37] text-xs font-mono text-amber-400 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>EXECUTIVE_DOSSIER // READY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f4f3ee] tracking-tight">
            Here's what you missed.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
            Synthesized from {result.stats.totalMessages} messages across {result.stats.participants.length} participants. Findings link back to their source messages.
          </p>
        </div>

        {/* Global actions: Copy, Export, View All Raw */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15161b] border border-[#272931] hover:border-[#383a45] text-xs text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm"
            title="Copy Executive Summary to Clipboard"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15161b] border border-[#272931] hover:border-[#383a45] text-xs text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm"
            title="Download full briefing as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export .MD</span>
          </button>

          <button
            type="button"
            onClick={handleExportPlainText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15161b] border border-[#272931] hover:border-[#383a45] text-xs text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm"
            title="Download full briefing as Plain Text"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export .TXT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHighlightedMessageId(null);
              setSourceViewerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#f4f3ee] hover:bg-white text-[#111215] text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Raw Chat ({result.messages.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrivacy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15161b] border border-[#272931] hover:border-emerald-500/50 text-xs text-emerald-400 font-medium transition-all cursor-pointer"
            title="View Privacy Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15161b] border border-[#272931] hover:border-rose-500/40 text-xs text-zinc-300 hover:text-rose-400 font-medium transition-all cursor-pointer"
            title="Reset and clear all conversation data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sentinel Bot Briefing Bar */}
      <div className="bg-[#131418] border border-[#24262d] rounded-2xl p-4 shadow-sm">
        <SentinelBot state="ready" message={botBriefingMessage} />
      </div>

      <CatchUpStory result={result} onViewSource={handleViewSource} />

      {/* Stats Ribbon with Warm Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-[#121317] border border-[#23242a] hover:border-[#33353e] transition-colors">
          <div className="text-[11px] text-zinc-400 font-medium font-mono">MSGS_TOTAL</div>
          <div className="text-2xl font-black text-[#f4f3ee] mt-1 font-mono">{result.stats.totalMessages}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-950/15 border border-rose-500/30 hover:border-rose-500/50 transition-colors">
          <div className="text-[11px] text-rose-300 font-medium flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> URGENT
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{result.stats.urgentCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/30 hover:border-emerald-500/50 transition-colors">
          <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> TASKS
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {result.stats.completedCount}/{result.stats.taskCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
          <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-amber-400" /> DEADLINES
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{result.stats.deadlineCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#181920] border border-[#2c2e39] hover:border-[#3d404d] transition-colors">
          <div className="text-[11px] text-zinc-300 font-medium flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-amber-400" /> DECISIONS
          </div>
          <div className="text-2xl font-black text-[#f4f3ee] mt-1 font-mono">{result.stats.decisionCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#181920] border border-[#2c2e39] hover:border-[#3d404d] transition-colors">
          <div className="text-[11px] text-zinc-300 font-medium flex items-center gap-1 font-mono">
            <MessageSquare className="w-3 h-3 text-orange-400" /> MENTIONS
          </div>
          <div className="text-2xl font-black text-[#f4f3ee] mt-1 font-mono">{result.stats.mentionCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#181920] border border-[#2c2e39] hover:border-[#3d404d] transition-colors col-span-2 sm:col-span-1">
          <div className="text-[11px] text-zinc-300 font-medium flex items-center gap-1 font-mono">
            <HelpCircle className="w-3 h-3 text-amber-400" /> WAITING ON
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{result.stats.unansweredCount}</div>
        </div>
      </div>

      {/* Section A: Executive Summary */}
      <section className="rounded-2xl border border-[#25272e] bg-[#121317] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#191a21] border border-[#2c2e39] text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                Section A: Executive Summary
              </h2>
              <p className="text-xs text-zinc-400">
                Ground-truth briefing synthesized strictly from actual conversation messages
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#191a21] text-zinc-300 border border-[#2c2e39]">
            {result.summary.length} Verified Points
          </span>
        </div>

        <div className="space-y-2.5">
          {result.summary.map((bullet, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-[#16171d] border border-[#24262d] text-xs sm:text-sm text-zinc-200 hover:border-[#343640] transition-colors"
            >
              <span className="w-5 h-5 rounded-md bg-[#22242c] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                {idx + 1}
              </span>
              <p className="leading-relaxed font-sans">{bullet}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#121317] border border-[#23242a]">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Items', count: result.items.length },
            { id: 'urgent', label: 'Urgent', count: result.stats.urgentCount },
            { id: 'task', label: 'Tasks', count: result.stats.taskCount },
            { id: 'deadline', label: 'Deadlines', count: result.stats.deadlineCount },
            { id: 'decision', label: 'Decisions', count: result.stats.decisionCount },
            { id: 'mention', label: 'Mentions', count: result.stats.mentionCount },
            { id: 'question', label: 'Questions', count: result.stats.unansweredCount },
            { id: 'update', label: 'Updates', count: updateItems.length },
            { id: 'completed', label: 'Completed', count: result.stats.completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-[#2b2d36] text-white shadow-sm'
                  : 'bg-[#16171d] text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2027]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeFilter === tab.id
                    ? 'bg-[#1b1c22] text-amber-300'
                    : 'bg-[#23242a] text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search briefing items..."
              className="w-full bg-[#0e0f12] border border-[#25272e] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0e0f12] border border-[#25272e] rounded-lg px-2.5 py-1.5 text-xs text-zinc-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 mr-1" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="priority" className="bg-[#121317] text-zinc-200">Priority</option>
              <option value="chronological" className="bg-[#121317] text-zinc-200">Chronological</option>
              <option value="sender" className="bg-[#121317] text-zinc-200">Sender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered View Items List */}
      {activeFilter !== 'all' || searchQuery ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing {filteredItems.length} items for filter <strong className="text-zinc-200 capitalize">"{activeFilter}"</strong>
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Reset to Full Dashboard
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[#24262d] bg-[#121317] text-zinc-400">
              <p className="text-sm">No items found matching the selected criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggleComplete={handleToggleComplete}
                  onViewSource={handleViewSource}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Full Structured Dashboard (Sections B through H) */
        <div className="space-y-10">
          {/* Section B: Act Now */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section B: Act Now
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold font-mono">
                  {actNowItems.length} ACTIONABLE
                </span>
              </div>
              <span className="text-xs text-zinc-400">Urgent tasks, overdue items & commitments</span>
            </div>

            {actNowItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                No immediate urgent tasks pending.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actNowItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section C: Upcoming Deadlines */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section C: Upcoming Deadlines
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                  {deadlineItems.length} DETECTED
                </span>
              </div>
              <span className="text-xs text-zinc-400">Chronological with explicit ambiguity rules</span>
            </div>

            {deadlineItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                No explicit deadlines detected.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deadlineItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section D: Decisions Made */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section D: Decision Signals
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1d1f27] text-zinc-300 border border-[#2d2f3a] font-semibold font-mono">
                  {decisionItems.length} SIGNALS
                </span>
              </div>
              <span className="text-xs text-zinc-400">Phrases that may indicate an agreement or choice</span>
            </div>

            {decisionItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                No explicit decisions reached in this session.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {decisionItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section E: You Were Mentioned */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section E: You Were Mentioned
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1d1f27] text-zinc-300 border border-[#2d2f3a] font-semibold font-mono">
                  {mentionItems.length} DIRECT PINGS
                </span>
              </div>
              <span className="text-xs text-zinc-400">Direct mentions and requests directed at you</span>
            </div>

            {mentionItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                No direct mentions detected for your configured name and aliases.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentionItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section F: Waiting On */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section F: Waiting On
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1d1f27] text-zinc-300 border border-[#2d2f3a] font-semibold font-mono">
                  {waitingOnItems.length} UNANSWERED
                </span>
              </div>
              <span className="text-xs text-zinc-400">Unanswered questions & blocker requests</span>
            </div>

            {waitingOnItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                All identified queries received subsequent answers.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waitingOnItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section G: Important Updates */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-300" />
                <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                  Section G: Important Updates
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1d1f27] text-zinc-300 border border-[#2d2f3a] font-semibold font-mono">
                  {updateItems.length} ANNOUNCEMENTS
                </span>
              </div>
              <span className="text-xs text-zinc-400">Meeting moves, announcements & schedule updates</span>
            </div>

            {updateItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#24262d] bg-[#121317] text-xs text-zinc-400">
                No major broadcast announcements identified.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {updateItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onViewSource={handleViewSource}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section H: Conversation Timeline */}
          {result.timeline.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Milestone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-[#f4f3ee] tracking-tight">
                    Section H: Conversation Timeline
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1d1f27] text-zinc-300 border border-[#2d2f3a] font-semibold font-mono">
                    {result.timeline.length} MILESTONES
                  </span>
                </div>
                <span className="text-xs text-zinc-400">Key chronological moments with source links</span>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#25272e]">
                {result.timeline.map((event) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#0c0d10]" />
                    <div className="p-4 rounded-xl bg-[#131418] border border-[#24262e] hover:border-[#383a45] transition-colors flex items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="font-mono text-zinc-400 font-semibold">{event.time}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-amber-400 font-semibold">{event.title}</span>
                        </div>
                        <p className="text-xs text-zinc-200">{event.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewSource(event.messageId)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-[#191a21] hover:bg-[#242630] px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 border border-[#2b2d38]"
                      >
                        <span>{event.messageId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Floating Source Inspector Drawer */}
      <SourceViewer
        messages={result.messages}
        highlightedId={highlightedMessageId}
        onClose={() => setSourceViewerOpen(false)}
        isOpen={sourceViewerOpen}
      />
    </div>
  );
};
