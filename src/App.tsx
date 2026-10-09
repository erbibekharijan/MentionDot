import { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { PrivacyModal } from './components/PrivacyModal';
import { AiConsentModal } from './components/AiConsentModal';
import { SAMPLE_CONVERSATION_RAW } from './data/sampleConversation';
import { parseConversation } from './utils/parser';
import { LocalHeuristicProvider } from './utils/analyzer';
import type { AnalysisResult, UserConfig } from './types';
import { ShieldCheck } from 'lucide-react';

const localAnalyzer = new LocalHeuristicProvider();

export function App() {
  const [rawText, setRawText] = useState<string>('');
  const [userConfig, setUserConfig] = useState<UserConfig>({
    userName: 'Bibek',
    aliases: ['bibek', '@bibek', 'bib'],
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);

  // Live parsed message count
  const messageCount = useMemo(() => {
    if (!rawText.trim()) return 0;
    const msgs = parseConversation(rawText);
    return msgs.length;
  }, [rawText]);

  // Run analysis
  const executeAnalysis = async (textToAnalyze: string, config: UserConfig) => {
    setIsAnalyzing(true);
    try {
      const messages = parseConversation(textToAnalyze);
      const analysis = await localAnalyzer.analyze(messages, config);
      setResult(analysis);

      // Scroll to dashboard
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };




  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    executeAnalysis(rawText, userConfig);
  };

  // Instant Demo: Load sample and analyze in one click
  const handleExploreDemo = () => {
    setRawText(SAMPLE_CONVERSATION_RAW);
    executeAnalysis(SAMPLE_CONVERSATION_RAW, userConfig);
  };

  // Load sample into textarea for inspection
  const handleLoadSample = () => {
    setRawText(SAMPLE_CONVERSATION_RAW);
  };

  // Reset all state to pure in-memory zero
  const handleReset = () => {
    if (window.confirm('Clear all conversation and briefing data from memory?')) {
      setRawText('');
      setResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToInput = () => {
    const el = document.getElementById('input-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        onOpenAiModal={() => setAiModalOpen(true)}
        onReset={handleReset}
        hasData={Boolean(result || rawText)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {result ? (
          /* Analysis Dashboard */
          <Dashboard
            result={result}
            onUpdateResult={setResult}
            onReset={handleReset}
            onOpenPrivacy={() => setPrivacyModalOpen(true)}
          />
        ) : (
          /* Landing Page & Input */
          <>
            <LandingHero
              onExploreDemo={handleExploreDemo}
              onScrollToInput={handleScrollToInput}
              onOpenPrivacy={() => setPrivacyModalOpen(true)}
            />

            <InputSection
              rawText={rawText}
              onChangeText={setRawText}
              userConfig={userConfig}
              onChangeUserConfig={setUserConfig}
              onAnalyze={handleAnalyze}
              onLoadSample={handleLoadSample}
              onClear={() => setRawText('')}
              isAnalyzing={isAnalyzing}
              messageCount={messageCount}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-850 bg-zinc-950/90 py-8 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-zinc-300">MISSED.</span>
            <span>— Built for Protocol X Hackathon</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              className="hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy Policy & Tech Guarantee</span>
            </button>
            <span>•</span>
            <span>Static Vercel Deployment Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <AiConsentModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        activeProvider={localAnalyzer.name}
      />
    </div>
  );
}

export default App;
