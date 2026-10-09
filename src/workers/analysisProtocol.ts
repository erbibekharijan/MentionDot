import type { AnalysisResult, UserConfig } from '../types';

export interface AnalysisRequest {
  id: number;
  rawText: string;
  userConfig: UserConfig;
}

export type AnalysisResponse =
  | { id: number; ok: true; result: AnalysisResult }
  | { id: number; ok: false; error: string };
