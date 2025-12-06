// API client - Handles all HTTP requests to the FileForge backend

import { API_CONFIG, getApiUrl } from "@/config/api";
import type {
  Document,
  DocumentListResponse,
  ConvertRequest,
  ConvertResponse,
  LLMReadyResponse,
  SupportedFormat,
  Chunk,
  PDFExtractionResponse,
} from "@/types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

// Document conversion
export async function convertFile(
  file: File,
  options: ConvertRequest = {}
): Promise<ConvertResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.chunk_strategy) {
    formData.append("chunk_strategy", options.chunk_strategy);
  }
  if (options.chunk_size) {
    formData.append("chunk_size", options.chunk_size.toString());
  }
  if (options.chunk_overlap) {
    formData.append("chunk_overlap", options.chunk_overlap.toString());
  }
  if (options.extract_tables !== undefined) {
    formData.append("extract_tables", options.extract_tables.toString());
  }
  if (options.ocr_enabled !== undefined) {
    formData.append("ocr_enabled", options.ocr_enabled.toString());
  }

  // Use AbortController for 10-minute timeout (first run downloads ML models)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

  try {
    const response = await fetch(getApiUrl(API_CONFIG.endpoints.convert), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || "File upload failed"
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function convertFileSync(
  file: File,
  options: ConvertRequest = {}
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.chunk_strategy) {
    formData.append("chunk_strategy", options.chunk_strategy);
  }
  if (options.chunk_size) {
    formData.append("chunk_size", options.chunk_size.toString());
  }
  if (options.chunk_overlap) {
    formData.append("chunk_overlap", options.chunk_overlap.toString());
  }
  if (options.extract_tables !== undefined) {
    formData.append("extract_tables", options.extract_tables.toString());
  }
  if (options.ocr_enabled !== undefined) {
    formData.append("ocr_enabled", options.ocr_enabled.toString());
  }

  // Use AbortController for 10-minute timeout (first run downloads ML models)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

  try {
    const response = await fetch(getApiUrl(API_CONFIG.endpoints.convertSync), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || "File conversion failed"
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getConversionStatus(id: number): Promise<Document> {
  return fetchApi<Document>(API_CONFIG.endpoints.convertStatus(id));
}

// Extract text from PDF
export async function extractPDFText(file: File): Promise<PDFExtractionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // Use AbortController for 10-minute timeout (first run downloads ML models)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

  try {
    const response = await fetch(getApiUrl(API_CONFIG.endpoints.convertLocal), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || "PDF text extraction failed"
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getSupportedFormats(): Promise<SupportedFormat[]> {
  return fetchApi<SupportedFormat[]>(API_CONFIG.endpoints.formats);
}

// Documents
export async function getDocuments(
  page = 1,
  pageSize = 20
): Promise<DocumentListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  return fetchApi<DocumentListResponse>(
    `${API_CONFIG.endpoints.documents}?${params}`
  );
}

export async function getDocument(id: number): Promise<Document> {
  return fetchApi<Document>(API_CONFIG.endpoints.document(id));
}

export async function getDocumentLLM(id: number): Promise<LLMReadyResponse> {
  return fetchApi<LLMReadyResponse>(API_CONFIG.endpoints.documentLLM(id));
}

export async function getDocumentChunks(id: number): Promise<Chunk[]> {
  return fetchApi<Chunk[]>(API_CONFIG.endpoints.documentChunks(id));
}

export async function deleteDocument(id: number): Promise<void> {
  await fetchApi(API_CONFIG.endpoints.document(id), {
    method: "DELETE",
  });
}

export async function reprocessDocument(id: number): Promise<ConvertResponse> {
  return fetchApi<ConvertResponse>(API_CONFIG.endpoints.documentReprocess(id), {
    method: "POST",
  });
}

export { ApiError };
