import { LocalHeuristicProvider } from '../utils/analyzer';
import { parseConversation } from '../utils/parser';
import { startMeasurement } from '../utils/perfMonitor';
import {
  isAnalysisRequest,
  type AnalysisRequest,
  type AnalysisResponse,
} from './analysisProtocol';

export async function runAnalysisRequest(
  input: unknown
): Promise<AnalysisResponse> {
  if (!isAnalysisRequest(input)) {
    const inputId =
      input !== null && typeof input === 'object' && 'id' in input
        ? input.id
        : undefined;
    const id =
      typeof inputId === 'number' &&
      Number.isSafeInteger(inputId) &&
      inputId > 0
        ? inputId
        : 1;
    return { id, ok: false, error: 'The analysis request was invalid.' };
  }
  const request: AnalysisRequest = input;
  const stopMeasurement = startMeasurement('worker.analysis');
  try {
    const messages = parseConversation(request.rawText);
    const result = await new LocalHeuristicProvider().analyze(
      messages,
      request.userConfig
    );
    const timing = stopMeasurement(messages.length);
    return { id: request.id, ok: true, result, durationMs: timing.durationMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return { id: request.id, ok: false, error: message };
  }
}

if (typeof self !== 'undefined') {
  self.addEventListener('message', (event: MessageEvent<unknown>) => {
    void runAnalysisRequest(event.data).then((response) => self.postMessage(response));
  });
}
