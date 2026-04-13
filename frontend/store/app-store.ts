import { create } from 'zustand';

export interface UploadedFile {
  name: string;
  size: string;
  rows: number;
  columns: number;
  uploadedAt: string;
}

export interface CsvColumnInfo {
  name: string;
  type: 'number' | 'string';
  sample: string;
}

export interface AiStatus {
  enabled: boolean;
  available: boolean;
  provider: string;
  configuredModel: string | null;
  activeModel: string | null;
  usingFallbackModel: boolean;
  status: 'disabled' | 'ready' | 'ready-fallback' | 'live' | 'fallback-model' | 'rate-limited';
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  chartType?: 'bar' | 'line' | 'pie' | 'table' | null;
  chartData?: Array<Record<string, string | number> & { label: string; value?: number; color?: string }>;
  chartConfig?: Record<string, { label: string; color: string }>;
  metrics?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  provider?: string;
  usedAi?: boolean;
  aiStatus?: AiStatus;
  keyPoints?: string[];
  followUps?: string[];
  timestamp: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  metric: string;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'query' | 'insight' | 'chart';
  description: string;
  timestamp: string;
}

const THEME_STORAGE_KEY = 'data-dashboard-theme';

function applyDocumentTheme(enabled: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', enabled);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
  }
}

function getInitialDarkMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') {
    return true;
  }

  if (savedTheme === 'light') {
    return false;
  }

  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return true;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

interface AppState {
  /** Reset all dashboard data (called on logout) */
  resetAllData: () => void;

  activePage: string;
  setActivePage: (page: string) => void;

  datasetId: string | null;
  setDatasetId: (datasetId: string | null) => void;

  uploadedFile: UploadedFile | null;
  setUploadedFile: (file: UploadedFile | null) => void;

  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;

  dataLoaded: boolean;
  setDataLoaded: (loaded: boolean) => void;

  // Theme
  isDarkMode: boolean;
  initializeTheme: () => void;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;

  // Raw CSV data for AI insights
  rawCsvRows: Record<string, string>[];
  csvHeaders: CsvColumnInfo[];
  setRawCsvData: (rows: Record<string, string>[], headers: CsvColumnInfo[]) => void;

  // Chart data
  barData: Record<string, string | number>[];
  lineData: Record<string, string | number>[];
  pieData: { name: string; value: number; color: string }[];
  setChartData: (
    bar: Record<string, string | number>[],
    line: Record<string, string | number>[],
    pie: { name: string; value: number; color: string }[]
  ) => void;

  insights: Insight[];
  setInsights: (insights: Insight[]) => void;

  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;

  recentActivity: ActivityItem[];
  addActivity: (activity: ActivityItem) => void;

  totalQueries: number;
  incrementQueries: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  resetAllData: () => {
    set({
      uploadedFile: null,
      datasetId: null,
      dataLoaded: false,
      barData: [], lineData: [], pieData: [],
      insights: [],
      chatMessages: [],
      recentActivity: [],
      totalQueries: 0,
      rawCsvRows: [], csvHeaders: [],
      activePage: 'dashboard',
    });
  },

  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  datasetId: null,
  setDatasetId: (datasetId) => set({ datasetId }),

  uploadedFile: null,
  setUploadedFile: (file) => set({ uploadedFile: file }),

  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),

  dataLoaded: false,
  setDataLoaded: (loaded) => set({ dataLoaded: loaded }),

  isDarkMode: false,
  initializeTheme: () => {
    const next = getInitialDarkMode();
    applyDocumentTheme(next);
    set({ isDarkMode: next });
  },
  setDarkMode: (enabled) => {
    applyDocumentTheme(enabled);
    set({ isDarkMode: enabled });
  },
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      applyDocumentTheme(next);
      return { isDarkMode: next };
    }),

  rawCsvRows: [],
  csvHeaders: [],
  setRawCsvData: (rows, headers) => set({ rawCsvRows: rows, csvHeaders: headers }),

  barData: [],
  lineData: [],
  pieData: [],
  setChartData: (bar, line, pie) => set({ barData: bar, lineData: line, pieData: pie }),

  insights: [],
  setInsights: (insights) => set({ insights }),

  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),

  recentActivity: [],
  addActivity: (activity) =>
    set((state) => ({ recentActivity: [activity, ...state.recentActivity].slice(0, 10) })),

  totalQueries: 0,
  incrementQueries: () => set((state) => ({ totalQueries: state.totalQueries + 1 })),
}));
