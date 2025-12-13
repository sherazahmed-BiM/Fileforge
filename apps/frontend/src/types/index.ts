// Document types matching the FileForge backend API

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";
export type ChunkStrategy = "semantic" | "fixed" | "none";
export type ChunkType = "semantic" | "fixed";

export interface DocumentMetadata {
  page_count?: number;
  element_counts?: Record<string, number>;
  languages?: string[];
  [key: string]: unknown;
}

export interface ChunkMetadata {
  html?: string;
  coordinates?: {
    points: number[][];
    system: string;
  };
  [key: string]: unknown;
}

export interface Chunk {
  id: number;
  document_id: number;
  index: number;
  text: string;
  text_length: number;
  token_count: number;
  chunk_type: ChunkType;
  element_category?: string;
  source_page?: number;
  source_section?: string;
  metadata?: ChunkMetadata;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  mime_type?: string;
  file_size_bytes: number;
  file_hash: string;
  status: DocumentStatus;
  chunk_strategy: string;
  chunk_size: number;
  chunk_overlap: number;
  total_chunks?: number;
  total_tokens?: number;
  raw_text_length?: number;
  metadata?: DocumentMetadata;
  error_message?: string;
  processing_duration_ms?: number;
  created_at: string;
  updated_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  chunks?: Chunk[];
}

export interface ConvertRequest {
  chunk_strategy?: ChunkStrategy;
  chunk_size?: number;
  chunk_overlap?: number;
  extract_tables?: boolean;
  extract_images?: boolean;
  ocr_enabled?: boolean;
  ocr_languages?: string;
}

export interface ConvertResponse {
  document_id: number;
  status: DocumentStatus;
  message: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
}

export interface LLMReadyResponse {
  id: number;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  processed_at: string;
  metadata: DocumentMetadata;
  content: {
    chunks: Array<{
      index: number;
      text: string;
      token_count: number;
      metadata: {
        chunk_type: ChunkType;
        element_category?: string;
        source_page?: number;
      };
    }>;
  };
  statistics: {
    total_chunks: number;
    total_tokens: number;
    chunk_strategy: string;
    processing_duration_ms?: number;
  };
}

export interface SupportedFormat {
  extension: string;
  mime_type: string;
  category: string;
  description: string;
}

// PDF text extraction response types
export interface PDFImage {
  description: string;
  data: string;  // base64 data URL
  metadata?: {
    original_width?: number;
    original_height?: number;
    extracted_width?: number;
    extracted_height?: number;
    image_type?: string;
    original_format?: string;
    position?: number;  // Position in original document order
    image_index?: number;
  };
}

export interface PDFPage {
  page_number: number;
  text: string;
  images: PDFImage[];
}

export interface PDFDocument {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_hash: string;
  format?: string;  // "structured_json" for CSV
  metadata?: Record<string, unknown>;
}

export interface PDFStatistics {
  page_count: number;
  word_count: number;
  image_count: number;
}

// CSV/Structured data types
export interface CSVColumnSchema {
  name: string;
  original_name: string;
  type: string;  // "string" | "integer" | "number" | "date" | "boolean"
  nullable: boolean;
  index: number;
}

export interface CSVTableSchema {
  columns: CSVColumnSchema[];
}

export interface CSVTable {
  name: string;
  schema: CSVTableSchema;
  rows: Record<string, unknown>[];
  row_count: number;
  column_count: number;
  page_index: number;
  total_pages: number;
}

export interface CSVSummary {
  total_rows: number;
  total_columns: number;
  columns: string[];
  column_types: Record<string, string>;
  total_pages: number;
  rows_per_page: number;
}

export interface CSVOrigin {
  source_type: string;
  delimiter: string;
  encoding: string;
}

export interface CSVExtractionResponse {
  document: PDFDocument;
  summary: CSVSummary;
  tables: CSVTable[];
  origin?: CSVOrigin;
  markdown?: string;  // Markdown table format from Docling
  extraction_method: string;
  warnings: string[];
}

// Standard document extraction response
export interface DocumentExtractionResponse {
  document: PDFDocument;
  pages: PDFPage[];
  statistics: PDFStatistics;
  extraction_method: string;
  warnings: string[];
}

// Union type for all extraction responses
export type PDFExtractionResponse = DocumentExtractionResponse | CSVExtractionResponse;

// Type guard to check if response is CSV
export function isCSVResponse(response: PDFExtractionResponse): response is CSVExtractionResponse {
  return 'tables' in response && 'summary' in response;
}

// Type guard to check if response is document
export function isDocumentResponse(response: PDFExtractionResponse): response is DocumentExtractionResponse {
  return 'pages' in response && 'statistics' in response;
}

// API Key types
export interface APIKey {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_rpm: number;
  rate_limit_rpd: number;
  total_requests: number;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateAPIKeyRequest {
  name?: string;
  rate_limit_rpm?: number;
  rate_limit_rpd?: number;
  expires_in_days?: number;
}

export interface CreateAPIKeyResponse {
  id: number;
  name: string;
  key: string;  // Full key - only shown once!
  key_prefix: string;
  rate_limit_rpm: number;
  rate_limit_rpd: number;
  expires_at: string | null;
  created_at: string;
}

export interface UpdateAPIKeyRequest {
  name?: string;
  is_active?: boolean;
  rate_limit_rpm?: number;
  rate_limit_rpd?: number;
}

export interface APIKeyListResponse {
  items: APIKey[];
  total: number;
}
