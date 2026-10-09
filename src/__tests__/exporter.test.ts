import { describe, it, expect } from 'vitest';
import { formatAsMarkdown, formatAsPlainText } from '../utils/exporter';
import { LocalHeuristicProvider } from '../utils/analyzer';
import { parseConversation } from '../utils/parser';
import { SAMPLE_CONVERSATION_RAW } from '../data/sampleConversation';

describe('Briefing Exporters', () => {
  const analyzer = new LocalHeuristicProvider();
  const userConfig = { userName: 'Bibek', aliases: ['bibek'] };

  it('formats full briefing to Markdown with all section headers and source references', async () => {
    const msgs = parseConversation(SAMPLE_CONVERSATION_RAW);
    const result = await analyzer.analyze(msgs, userConfig);

    const md = formatAsMarkdown(result);

    expect(md).toContain('# MISSED. — Catch-Up Intelligence Briefing');
    expect(md).toContain('## 📌 Executive Summary');
    expect(md).toContain('Ref: msg-');
    expect(md).toContain('Zero Cloud Transmission');
  });

  it('formats full briefing to Plain Text', async () => {
    const msgs = parseConversation(SAMPLE_CONVERSATION_RAW);
    const result = await analyzer.analyze(msgs, userConfig);

    const txt = formatAsPlainText(result);

    expect(txt).toContain('MISSED. — Catch-Up Intelligence Briefing');
    expect(txt).toContain('EXECUTIVE SUMMARY:');
    expect(txt).toContain('ACT NOW / URGENT ITEMS:');
  });
});
