// API configuration - Single source of truth for API settings

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:19000",
  endpoints: {
    // Auth endpoints
    signup: "/api/v1/auth/signup",
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    verifyEmail: "/api/v1/auth/verify-email",
    verifyOTP: "/api/v1/auth/verify-otp",
    resendVerification: "/api/v1/auth/resend-verification",
    // Convert endpoints
    convert: "/api/v1/convert",
    convertSync: "/api/v1/convert/sync",
    convertLocal: "/api/v1/convert/local",  // New: page-by-page with images
    convertStatus: (id: number) => `/api/v1/convert/status/${id}`,
    formats: "/api/v1/convert/formats",
    // Document endpoints
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
