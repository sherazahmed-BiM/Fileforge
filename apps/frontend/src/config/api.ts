// API configuration - Single source of truth for API settings

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:19000",
  endpoints: {
    convert: "/api/v1/convert",
    convertSync: "/api/v1/convert/sync",
    convertStatus: (id: number) => `/api/v1/convert/status/${id}`,
    formats: "/api/v1/convert/formats",
    documents: "/api/v1/documents",
    document: (id: number) => `/api/v1/documents/${id}`,
    documentLLM: (id: number) => `/api/v1/documents/${id}/llm`,
    documentChunks: (id: number) => `/api/v1/documents/${id}/chunks`,
    documentReprocess: (id: number) => `/api/v1/documents/${id}/reprocess`,
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};
