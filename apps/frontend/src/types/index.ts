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
export interface PDFPage {
  page_number: number;
  text: string;
}

export interface PDFDocument {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_hash: string;
  metadata?: Record<string, unknown>;
}

export interface PDFStatistics {
  page_count: number;
  word_count: number;
}

export interface PDFExtractionResponse {
  document: PDFDocument;
  pages: PDFPage[];
  statistics: PDFStatistics;
  extraction_method: string;
  warnings: string[];
}
