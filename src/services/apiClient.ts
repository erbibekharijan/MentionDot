import type { AnalysisResult, UserConfig } from '../types/index.ts';
import type {
  ApiResponse,
  HealthCheckData,
  ParseResponseData,
  ExportResponseData,
  MetricsResponseData,
} from '../../server/types.ts';

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = (await response.json()) as ApiResponse;
        if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // Fall back to default status text
      }
      throw new Error(errorMsg);
    }

    const json = (await response.json()) as ApiResponse<T>;
    if (!json.success || !json.data) {
      throw new Error(json.error?.message || 'Unsuccessful API response');
    }

    return json.data;
  }

  public async getHealth(): Promise<HealthCheckData> {
    return this.request<HealthCheckData>('/api/health', { method: 'GET' });
  }

  public async analyze(
    text: string,
    config?: Partial<UserConfig>
  ): Promise<AnalysisResult> {
    return this.request<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, config }),
    });
  }

  public async parse(text: string): Promise<ParseResponseData> {
    return this.request<ParseResponseData>('/api/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  public async exportBriefing(
    result: AnalysisResult,
    format: 'markdown' | 'text' | 'json'
  ): Promise<ExportResponseData> {
    return this.request<ExportResponseData>('/api/export', {
      method: 'POST',
      body: JSON.stringify({ result, format }),
    });
  }

  public async getMetrics(): Promise<MetricsResponseData> {
    return this.request<MetricsResponseData>('/api/metrics', { method: 'GET' });
  }
}

export const apiClient = new ApiClient();
