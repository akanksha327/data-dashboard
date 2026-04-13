import type { AiStatus, CsvColumnInfo, Insight, UploadedFile } from '@/lib/app-store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000';

type QueryTrend = 'up' | 'down' | 'neutral';

export interface UploadApiResponse {
  datasetId: string;
  uploadedFile: UploadedFile;
  headers: CsvColumnInfo[];
  charts: {
    barData: Record<string, string | number>[];
    lineData: Record<string, string | number>[];
    pieData: { name: string; value: number; color: string }[];
  };
  insights: Insight[];
  message: string;
}

export interface QueryApiResponse {
  id: string;
  question: string;
  chartType: 'bar' | 'line' | 'pie' | 'table' | null;
  chartData?: Array<Record<string, string | number> & { label: string; value?: number; color?: string }>;
  chartConfig?: Record<string, { label: string; color: string }>;
  summary: string;
  metrics?: { label: string; value: string; trend?: QueryTrend }[];
  keyPoints?: string[];
  followUps?: string[];
  timestamp: string;
  provider?: string;
  usedAi?: boolean;
  aiStatus?: AiStatus;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch {
    return `Request failed with status ${response.status}.`;
  }

  return `Request failed with status ${response.status}.`;
}

export async function uploadDataset(file: File): Promise<UploadApiResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function queryDataset(input: {
  datasetId?: string;
  question: string;
}): Promise<QueryApiResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}
