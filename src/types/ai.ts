export interface AiStatsResponse {
  totalAnalyses: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  uniqueUsers: number;
  averageTokensPerAnalysis: number;
  averageCostPerAnalysis: number;
  analysesByDay: { date: string; count: number; costUsd: number }[];
}

export interface DocumentAnalysis {
  id: string;
  fileUrl: string;
  fileType: string;
  pageCount: number;
  tokensUsed: number;
  costUsd: number;
  createdAt: string;
  user: { id: string; email: string; fullName: string };
  overallScore: number | null;
  detectedDocuments: string[];
  summary: string | null;
}

export interface DocumentAnalysisDetail extends DocumentAnalysis {
  result: {
    overallScore?: number;
    score?: number;
    detectedDocuments?: Array<{ documentType: string }>;
    summary?: string;
    errors?: unknown[];
    warnings?: unknown[];
    recommendations?: unknown[];
    missingDocuments?: unknown[];
    extractedInfo?: unknown;
  } | null;
}

export interface DocumentAnalysesListResponse {
  items: DocumentAnalysis[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentAnalysesFilter {
  page: number;
  limit: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}
