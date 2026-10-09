import { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { PrivacyModal } from './components/PrivacyModal';
import { AiConsentModal } from './components/AiConsentModal';
import { GuidedDemo } from './components/GuidedDemo';
import { SAMPLE_CONVERSATION_RAW } from './data/sampleConversation';
import { parseConversation } from './utils/parser';
import { sanitizeRawText } from './utils/sanitizer';
import { validateAnalysisInputs } from './utils/inputValidator';
import type { AnalysisResult, UserConfig } from './types';
import { GUIDED_DEMO_SEEN_KEY } from './types/guidedDemo';
import type { GuidedDemoStep } from './types/guidedDemo';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useLocalAnalysisWorker } from './hooks/useLocalAnalysisWorker';
import { useDebouncedValue } from './hooks/useDebouncedValue';

export function App() {
  const { analyze: analyzeInWorker, cancel: cancelWorkerAnalysis } =
    useLocalAnalysisWorker();
  const [rawText, setRawText] = useState<string>('');
  const [userConfig, setUserConfig] = useState<UserConfig>({
    userName: 'Bibek',
    aliases: ['bibek', '@bibek', 'bib'],
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<GuidedDemoStep | null>(() => {
    try {
      return window.localStorage.getItem(GUIDED_DEMO_SEEN_KEY) === 'true'
        ? null
        : 'welcome';
    } catch (error) {
      console.error('Could not read the guided-demo preference:', error);
      return 'welcome';
    }
  });
  const [tourNotice, setTourNotice] = useState<string | null>(null);
  const tourSampleLoaded = useRef(false);
  const preTourState = useRef<{ rawText: string; result: AnalysisResult | null } | null>(null);
  const tourGeneration = useRef(0);
  const analysisGeneration = useRef(0);

  // Live parsed message count — debounced to avoid per-keystroke parser runs
  // on large conversation pastes (e.g. 500+ lines).
  const debouncedRawText = useDebouncedValue(rawText, 300);
  const messageCount = debouncedRawText.trim()
    ? parseConversation(debouncedRawText).length
    : 0;

  // Run analysis
  const executeAnalysis = async (
    textToAnalyze: string,
    config: UserConfig,
    isCurrent: () => boolean = () => true
  ): Promise<boolean> => {
    const generation = ++analysisGeneration.current;
    const isAnalysisCurrent = () =>
      analysisGeneration.current === generation && isCurrent();
    setAnalysisError(null);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeInWorker(textToAnalyze, config);
      if (!isAnalysisCurrent()) return false;
      setResult(analysis);

      // Scroll to dashboard
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } catch (err) {
      if (isAnalysisCurrent() && !(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Analysis failed:', err);
        setAnalysisError(
          err instanceof Error
            ? `Analysis failed: ${err.message}`
            : 'Analysis failed unexpectedly. Please try again.'
        );
      }
      return false;
    } finally {
      if (isAnalysisCurrent()) setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    // Sanitize input before dispatching to the worker.
    const sanitized = sanitizeRawText(rawText);
    // Validate sanitized text + config before starting the worker.
    const validation = validateAnalysisInputs(sanitized, userConfig);
    if (!validation.ok) {
      setAnalysisError(validation.reason || 'Input validation failed. Please check your conversation text.');
      return;
    }
    // Clear any previous error on valid input
    setAnalysisError(null);
    // Replace displayed raw text with the sanitized version.
    setRawText(sanitized);
    executeAnalysis(sanitized, userConfig);
  };

  // Instant Demo: Load sample and analyze in one click
  const handleExploreDemo = () => {
    setRawText(SAMPLE_CONVERSATION_RAW);
    executeAnalysis(SAMPLE_CONVERSATION_RAW, userConfig);
  };

  const rememberTourChoice = () => {
    try {
      window.localStorage.setItem(GUIDED_DEMO_SEEN_KEY, 'true');
      setTourNotice(null);
    } catch (error) {
      console.error('Could not save the guided-demo preference:', error);
      setTourNotice(
        'Your browser blocked saving this tutorial preference. The tour can still run, but may appear again on your next visit.'
      );
    }
  };

  const handleStartTour = () => {
    preTourState.current = { rawText, result };
    rememberTourChoice();
    setTourStep('input');
  };

  const handleCloseTour = () => {
    tourGeneration.current += 1;
    analysisGeneration.current += 1;
    cancelWorkerAnalysis();
    setIsAnalyzing(false);
    rememberTourChoice();
    setTourStep(null);
    if (tourSampleLoaded.current) {
      setRawText(preTourState.current?.rawText ?? '');
      setResult(preTourState.current?.result ?? null);
      tourSampleLoaded.current = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    preTourState.current = null;
  };

  const handleReplayTour = () => {
    tourGeneration.current += 1;
    analysisGeneration.current += 1;
    cancelWorkerAnalysis();
    setIsAnalyzing(false);
    setTourNotice(null);
    preTourState.current = { rawText, result };
    tourSampleLoaded.current = false;
    setTourStep('input');
  };

  const handleTourLoadDemo = async () => {
    const generation = ++tourGeneration.current;
    setTourNotice(null);
    tourSampleLoaded.current = true;
    setRawText(SAMPLE_CONVERSATION_RAW);
    const loaded = await executeAnalysis(
      SAMPLE_CONVERSATION_RAW,
      userConfig,
      () => tourGeneration.current === generation && tourSampleLoaded.current
    );
    if (tourGeneration.current !== generation) return;
    if (loaded) {
      setTourStep('story');
    } else {
      setTourNotice('The sample could not be analyzed. Retry, or skip the tour.');
    }
  };

  const handleTourAdvance = () => {
    if (tourStep === 'story') setTourStep('source');
    else if (tourStep === 'evidence') setTourStep('task');
    else if (tourStep === 'task') setTourStep('filters');
    else if (tourStep === 'filters') setTourStep('tools');
    else if (tourStep === 'tools') setTourStep('finish');
    else if (tourStep === 'finish') handleCloseTour();
  };

  const handleTourSourceOpened = () => {
    if (tourStep === 'source') setTourStep('evidence');
  };

  // Load sample into textarea for inspection
  const handleLoadSample = () => {
    setRawText(SAMPLE_CONVERSATION_RAW);
  };

  // Reset all state to pure in-memory zero
  const handleReset = () => {
    if (window.confirm('Clear the current conversation and briefing? Your tutorial preference will be kept.')) {
      analysisGeneration.current += 1;
      cancelWorkerAnalysis();
      setIsAnalyzing(false);
      setRawText('');
      setResult(null);
      setTourStep(null);
      tourGeneration.current += 1;
      tourSampleLoaded.current = false;
      preTourState.current = null;
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
        onReplayTour={handleReplayTour}
      />

      {/* Main Content */}
      <main className="flex-1">
        {analysisError && (
          <div
            role="alert"
            className="mx-auto mt-5 max-w-3xl rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {analysisError}
          </div>
        )}
        {result ? (
          /* Analysis Dashboard */
          <Dashboard
            result={result}
            onUpdateResult={setResult}
            onReset={handleReset}
            onOpenPrivacy={() => setPrivacyModalOpen(true)}
            tourStep={tourStep}
            onTourSourceOpened={handleTourSourceOpened}
          />
        ) : (
          /* Landing Page & Input */
          <>
            <LandingHero
              onExploreDemo={handleExploreDemo}
              onScrollToInput={handleScrollToInput}
              onOpenPrivacy={() => setPrivacyModalOpen(true)}
            />

            {analysisError && (
              <div
                role="alert"
                className="max-w-4xl mx-auto my-4 p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 flex items-center justify-between gap-3 text-sm animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{analysisError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalysisError(null)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

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
        activeProvider="Local Heuristic Engine"
      />

      <GuidedDemo
        step={tourStep}
        notice={tourNotice}
        onStart={handleStartTour}
        onSkip={handleCloseTour}
        onLoadDemo={handleTourLoadDemo}
        onAdvance={handleTourAdvance}
      />

      {tourNotice && !tourStep && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-[90] flex max-w-md items-start gap-3 rounded-xl border border-amber-300 bg-[#fffefa] p-4 text-sm text-amber-950 shadow-xl"
        >
          <span>{tourNotice}</span>
          <button
            type="button"
            onClick={() => setTourNotice(null)}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold hover:bg-amber-50"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
