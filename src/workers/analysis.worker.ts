import { LocalHeuristicProvider } from '../utils/analyzer';
import { parseConversation } from '../utils/parser';
import type { AnalysisRequest, AnalysisResponse } from './analysisProtocol';

export async function runAnalysisRequest(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  try {
    const messages = parseConversation(request.rawText);
    const result = await new LocalHeuristicProvider().analyze(
      messages,
      request.userConfig
    );
    return { id: request.id, ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return { id: request.id, ok: false, error: message };
  }
}

if (typeof self !== 'undefined') {
  self.addEventListener('message', (event: MessageEvent<AnalysisRequest>) => {
    void runAnalysisRequest(event.data).then((response) => self.postMessage(response));
  });
}
