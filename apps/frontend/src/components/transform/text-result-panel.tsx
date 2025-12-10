"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PDFExtractionResponse, CSVExtractionResponse, DocumentExtractionResponse } from "@/types";
import { isCSVResponse, isDocumentResponse } from "@/types";

// Custom SVG Icons
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 10L8 14L16 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface TextResultPanelProps {
  result: PDFExtractionResponse | null;
  isLoading: boolean;
  error: string | null;
  width?: number;
  onResizeStart?: () => void;
}

export function TextResultPanel({ result, isLoading, error, width, onResizeStart }: TextResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "markdown" | "json">("preview");
  const [copiedPage, setCopiedPage] = useState<number | null>(null);

  // Check if markdown is available (for CSV or PDF/documents)
  const hasMarkdown = Boolean(result && (
    (isCSVResponse(result) && result.markdown) ||
    (isDocumentResponse(result) && result.document.metadata?.markdown)
  ));

  // Get markdown content from either response type
  const getMarkdownContent = (): string | null => {
    if (!result) return null;
    if (isCSVResponse(result)) return result.markdown || null;
    if (isDocumentResponse(result)) return result.document.metadata?.markdown as string || null;
    return null;
  };

  // Get file type for specialized rendering
  const getFileType = (): string => {
    if (!result) return "unknown";
    return result.document.file_type?.toLowerCase() || "unknown";
  };

  // Get file type display name
  const getFileTypeLabel = (): string => {
    const fileType = getFileType();
    const labels: Record<string, string> = {
      pdf: "PDF Document",
      docx: "Word Document",
      xlsx: "Excel Spreadsheet",
      pptx: "PowerPoint Presentation",
      html: "HTML Document",
      htm: "HTML Document",
      xhtml: "XHTML Document",
      md: "Markdown",
      markdown: "Markdown",
      csv: "CSV Data",
      png: "Image (PNG)",
      jpg: "Image (JPEG)",
      jpeg: "Image (JPEG)",
      tiff: "Image (TIFF)",
      tif: "Image (TIFF)",
      bmp: "Image (BMP)",
      webp: "Image (WebP)",
      gif: "Image (GIF)",
      adoc: "AsciiDoc",
      asciidoc: "AsciiDoc",
    };
    return labels[fileType] || fileType.toUpperCase();
  };

  // Dynamic width style
  const panelStyle = width ? { width: `${width}px` } : {};

  const handleDownload = () => {
    if (!result) return;
    const content = JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.document.filename.replace(/\.[^/.]+$/, "")}_text.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPage = async (pageNum: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPage(pageNum);
    setTimeout(() => setCopiedPage(null), 2000);
  };

  const handleCopyAll = async () => {
    if (!result) return;

    let allText: string;
    if (isCSVResponse(result)) {
      // For CSV, copy as JSON
      allText = JSON.stringify(result.tables.flatMap(t => t.rows), null, 2);
    } else {
      allText = result.pages.map(p => p.text).join("\n\n---\n\n");
    }

    await navigator.clipboard.writeText(allText);
    setCopiedPage(-1); // -1 indicates "all"
    setTimeout(() => setCopiedPage(null), 2000);
  };

  // Helper to get statistics from either response type
  const getStats = () => {
    if (!result) return { pageCount: 0, wordCount: 0, imageCount: 0, rowCount: 0, columnCount: 0, isCSV: false };

    if (isCSVResponse(result)) {
      return {
        pageCount: result.summary.total_pages,
        wordCount: 0,
        imageCount: 0,
        rowCount: result.summary.total_rows,
        columnCount: result.summary.total_columns,
        isCSV: true,
      };
    }

    return {
      pageCount: result.statistics.page_count,
      wordCount: result.statistics.word_count,
      imageCount: result.statistics.image_count,
      rowCount: 0,
      columnCount: 0,
      isCSV: false,
    };
  };

  // Resize handle component
  const ResizeHandle = () => (
    <div
      className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4A6B5A]/30 active:bg-[#4A6B5A]/50 transition-colors group z-10"
      onMouseDown={onResizeStart}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-[#EDEAE4] group-hover:bg-[#4A6B5A] transition-colors rounded-r" />
    </div>
  );

  // Base container classes
  const containerClasses = "bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0 relative";
  const defaultWidth = width ? undefined : "w-[480px]";

  // Empty state
  if (!result && !isLoading && !error) {
    return (
      <div className={`${defaultWidth} ${containerClasses}`} style={panelStyle}>
        <ResizeHandle />
        <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4]">
          <h3 className="font-display font-bold text-[#1A1A1A]">Extracted Text</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F5F2ED] neo-border flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-[#6B6B6B]" />
            </div>
            <p className="text-[#1A1A1A] font-display font-bold text-lg">No results yet</p>
            <p className="text-sm font-body text-[#6B6B6B] mt-1">
              Upload a PDF to extract text
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${defaultWidth} ${containerClasses}`} style={panelStyle}>
        <ResizeHandle />
        <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4]">
          <h3 className="font-display font-bold text-[#1A1A1A]">Extracted Text</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#FEF2F2] neo-border border-[#B54A4A] flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-10 h-10 text-[#B54A4A]" />
            </div>
            <p className="text-[#1A1A1A] font-display font-bold text-lg">Error extracting text</p>
            <p className="text-sm font-body text-[#B54A4A] mt-2 max-w-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`${defaultWidth} ${containerClasses}`} style={panelStyle}>
        <ResizeHandle />
        <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4]">
          <h3 className="font-display font-bold text-[#1A1A1A]">Extracted Text</h3>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#C4705A] animate-pulse" />
            <span className="text-sm font-body text-[#6B6B6B]">Extracting text from PDF...</span>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-3/4 bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-5/6 bg-[#F5F2ED] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${defaultWidth} ${containerClasses} overflow-hidden`} style={panelStyle}>
      <ResizeHandle />
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4] shrink-0">
        <h3 className="font-display font-bold text-[#1A1A1A]">Extracted Text</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyAll}
            className="h-9 w-9 rounded-lg neo-border bg-white hover:bg-[#F5F2ED] flex items-center justify-center transition-colors cursor-pointer"
            title="Copy all text"
          >
            {copiedPage === -1 ? (
              <CheckIcon className="h-4 w-4 text-[#4A6B5A]" />
            ) : (
              <CopyIcon className="h-4 w-4 text-[#2C2C2C]" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="h-9 w-9 rounded-lg neo-border bg-white hover:bg-[#F5F2ED] flex items-center justify-center transition-colors cursor-pointer"
            title="Download JSON"
          >
            <DownloadIcon className="h-4 w-4 text-[#2C2C2C]" />
          </button>
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-[#F5F2ED] p-1 neo-border">
            <button
              className={`px-3 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-white text-[#1A1A1A] neo-shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            {hasMarkdown && (
              <button
                className={`px-3 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "markdown"
                    ? "bg-white text-[#1A1A1A] neo-shadow-sm"
                    : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                }`}
                onClick={() => setActiveTab("markdown")}
              >
                Markdown
              </button>
            )}
            <button
              className={`px-3 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "json"
                  ? "bg-white text-[#1A1A1A] neo-shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
              onClick={() => setActiveTab("json")}
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-[#4A6B5A]/10 to-[#6B9B8A]/10 border-b-[2.5px] border-[#4A6B5A]/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#4A6B5A] flex items-center justify-center">
              <CheckmarkIcon className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-display font-semibold text-[#1A1A1A]">
              {getFileTypeLabel()}
            </span>
          </div>
          <span className="text-xs text-[#6B6B6B]">•</span>
          <span className="text-sm font-body text-[#6B6B6B]">
            {(() => {
              const stats = getStats();
              if (stats.isCSV) {
                return `${stats.rowCount.toLocaleString()} rows, ${stats.columnCount} columns`;
              }
              const parts = [];
              if (stats.pageCount > 0) parts.push(`${stats.pageCount} page${stats.pageCount > 1 ? 's' : ''}`);
              if (stats.wordCount > 0) parts.push(`${stats.wordCount.toLocaleString()} words`);
              if (stats.imageCount > 0) parts.push(`${stats.imageCount} image${stats.imageCount > 1 ? 's' : ''}`);
              return parts.join(', ') || 'Extracted';
            })()}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {result!.warnings && result!.warnings.length > 0 && (
        <div className="px-6 py-2 bg-[#FEF3CD] border-b-[2.5px] border-[#856404]/20">
          <p className="text-xs font-body text-[#856404]">
            {result!.warnings.join("; ")}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0 p-6 scrollbar-thin">
        {activeTab === "preview" ? (
          isCSVResponse(result!) ? (
            <CSVContent
              tables={result!.tables}
              summary={result!.summary}
            />
          ) : (
            <PreviewContent
              result={result as DocumentExtractionResponse}
              fileType={getFileType()}
            />
          )
        ) : activeTab === "markdown" && hasMarkdown ? (
          <MarkdownContent markdown={getMarkdownContent()!} fileType={getFileType()} />
        ) : (
          <JsonContent result={result!} />
        )}
      </div>
    </div>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  );
}

function PreviewContent({
  result,
  fileType,
}: {
  result: DocumentExtractionResponse;
  fileType: string;
}) {
  // Check if this is an image file type
  const isImageFile = ["png", "jpg", "jpeg", "tiff", "tif", "bmp", "webp", "gif"].includes(fileType);

  // Check if this is a markdown file
  const isMarkdownFile = ["md", "markdown"].includes(fileType);

  // Check if this is a single-page document type (DOCX, HTML, AsciiDoc)
  const isSinglePageDoc = ["docx", "html", "htm", "xhtml", "adoc", "asciidoc"].includes(fileType);

  // Deduplicate images by data hash
  const getUniqueImages = (images: DocumentExtractionResponse["pages"][0]["images"]) => {
    if (!images) return [];
    const seen = new Set<string>();
    return images.filter((img) => {
      if (!img.data) return false;
      const hash = img.data.slice(0, 100);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  };

  // Sort images by position (lower position = higher on page after backend fix)
  const sortImagesByPosition = (images: DocumentExtractionResponse["pages"][0]["images"]) => {
    const unique = getUniqueImages(images);
    return unique.sort((a, b) => {
      const posA = a.metadata?.position ?? a.metadata?.image_index ?? 0;
      const posB = b.metadata?.position ?? b.metadata?.image_index ?? 0;
      return posA - posB;
    });
  };

  // For image files, show original image prominently first
  if (isImageFile) {
    const allImages = result.pages.flatMap(p => sortImagesByPosition(p.images));
    const allText = result.pages.map(p => p.text).filter(Boolean).join("\n\n");

    return (
      <div className="space-y-6">
        {/* Original Image */}
        {allImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#C4705A]" />
              <span className="text-sm font-display font-semibold text-[#1A1A1A]">
                Original Image
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {allImages.map((image, idx) => (
                <div key={idx} className="inline-block rounded-lg neo-border overflow-hidden bg-[#F5F2ED] w-fit max-w-full">
                  <img
                    src={image.data}
                    alt={image.description || `Image ${idx + 1}`}
                    className="h-auto max-w-full"
                    style={{ maxWidth: '100%' }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Extracted Text */}
        {allText && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-display font-bold bg-[#4A6B5A] text-white rounded-md">
                OCR Text
              </span>
            </div>
            <div className="p-4 bg-[#F5F2ED] rounded-xl neo-border">
              <p className="text-sm font-body text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">
                {allText}
              </p>
            </div>
          </div>
        )}

        {!allImages.length && !allText && (
          <div className="text-sm font-body text-[#6B6B6B] italic">
            No content could be extracted from this image
          </div>
        )}
      </div>
    );
  }

  // For markdown files, render the markdown directly from metadata
  if (isMarkdownFile && result.document.metadata?.markdown) {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {result.document.metadata.markdown as string}
        </ReactMarkdown>
      </div>
    );
  }

  // For single-page documents (DOCX, HTML, AsciiDoc), render without page header
  if (isSinglePageDoc) {
    const allImages = result.pages.flatMap(p => sortImagesByPosition(p.images));
    const allText = result.pages.map(p => p.text).filter(Boolean).join("\n\n");
    const markdown = result.document.metadata?.markdown as string | undefined;

    // If we have markdown, render it for better formatting
    if (markdown) {
      return (
        <div className="space-y-6">
          {/* Images first */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C4705A]" />
                <span className="text-xs font-display font-semibold text-[#6B6B6B]">
                  {allImages.length} image{allImages.length > 1 ? "s" : ""} extracted
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {allImages.map((image, idx) => (
                  <div key={idx} className="inline-block rounded-lg neo-border overflow-hidden bg-[#F5F2ED] w-fit max-w-full">
                    <img
                      src={image.data}
                      alt={image.description || `Image ${idx + 1}`}
                      className="h-auto max-w-full"
                      style={{
                        width: image.metadata?.extracted_width
                          ? `${Math.min(image.metadata.extracted_width, 400)}px`
                          : 'auto'
                      }}
                      loading="lazy"
                    />
                    {image.description && (
                      <div className="px-3 py-2 text-xs text-[#6B6B6B] border-t border-[#EDEAE4]">
                        <span className="font-display font-semibold">{image.description}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document content */}
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // Fallback: render plain text
    return (
      <div className="space-y-6">
        {/* Images first */}
        {allImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#C4705A]" />
              <span className="text-xs font-display font-semibold text-[#6B6B6B]">
                {allImages.length} image{allImages.length > 1 ? "s" : ""} extracted
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {allImages.map((image, idx) => (
                <div key={idx} className="inline-block rounded-lg neo-border overflow-hidden bg-[#F5F2ED] w-fit max-w-full">
                  <img
                    src={image.data}
                    alt={image.description || `Image ${idx + 1}`}
                    className="h-auto max-w-full"
                    style={{
                      width: image.metadata?.extracted_width
                        ? `${Math.min(image.metadata.extracted_width, 400)}px`
                        : 'auto'
                    }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text content */}
        {allText ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {allText}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm font-body text-[#6B6B6B] italic">
            No text content extracted
          </div>
        )}
      </div>
    );
  }

  // Standard page-by-page rendering for documents (PDF, PPTX)
  return (
    <div className="space-y-6">
      {result.pages.map((page) => {
        const sortedImages = sortImagesByPosition(page.images);

        return (
          <div key={page.page_number} className="space-y-4">
            {/* Page header */}
            <div className="flex items-center gap-2 sticky top-0 bg-white py-2 border-b border-[#EDEAE4] z-10">
              <span className="px-2 py-1 text-xs font-display font-bold bg-[#4A6B5A] text-white rounded-md">
                {fileType === "pptx" ? `Slide ${page.page_number}` : `Page ${page.page_number}`}
              </span>
              {sortedImages.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-display font-semibold bg-[#C4705A] text-white rounded-md">
                  <ImageIcon className="w-3 h-3" />
                  {sortedImages.length}
                </span>
              )}
            </div>

            {/* Images at top of page (sorted by position - top images first) */}
            {sortedImages.length > 0 && (
              <div className="flex flex-col gap-3">
                {sortedImages.map((image, idx) => (
                  <div key={idx} className="inline-block rounded-lg neo-border overflow-hidden bg-[#F5F2ED] w-fit max-w-full">
                    <img
                      src={image.data}
                      alt={image.description || `Image ${idx + 1}`}
                      className="h-auto max-w-full"
                      style={{
                        width: image.metadata?.extracted_width
                          ? `${Math.min(image.metadata.extracted_width, 400)}px`
                          : 'auto'
                      }}
                      loading="lazy"
                    />
                    {image.description && (
                      <div className="px-3 py-2 text-xs text-[#6B6B6B] border-t border-[#EDEAE4]">
                        <span className="font-display font-semibold">
                          {image.description}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Page text content */}
            {page.text ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {page.text}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-sm font-body text-[#6B6B6B] italic">
                {fileType === "pptx" ? "No text on this slide" : "No text on this page"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Shared markdown components for consistent rendering
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-display font-bold text-[#1A1A1A] mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-display font-bold text-[#1A1A1A] mt-3 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-display font-semibold text-[#1A1A1A] mt-3 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm font-body text-[#2C2C2C] leading-relaxed mb-2">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside text-sm font-body text-[#2C2C2C] mb-2 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside text-sm font-body text-[#2C2C2C] mb-2 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm font-body text-[#2C2C2C]">{children}</li>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 text-xs font-mono bg-[#F5F2ED] text-[#C4705A] rounded">
          {children}
        </code>
      );
    }
    return (
      <code className="block p-3 text-xs font-mono bg-[#F5F2ED] text-[#2C2C2C] rounded-lg overflow-x-auto">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-[#F5F2ED] rounded-lg neo-border mb-2 overflow-hidden">
      {children}
    </pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-3 neo-border rounded-lg">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-[#4A6B5A] text-white">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-display font-semibold">
      {children}
    </th>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-[#EDEAE4]">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-[#F5F2ED] transition-colors">{children}</tr>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-xs font-body text-[#2C2C2C]">
      {children}
    </td>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-[#4A6B5A] pl-4 my-2 text-sm italic text-[#6B6B6B]">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-[#4A6B5A] hover:text-[#3A5B4A] underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  img: () => null, // Skip images in markdown - shown separately
  hr: () => <hr className="my-3 border-[#EDEAE4]" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-[#1A1A1A]">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-[#2C2C2C]">{children}</em>
  ),
};

function TextContent({
  pages,
  copiedPage,
  onCopyPage
}: {
  pages: DocumentExtractionResponse["pages"];
  copiedPage: number | null;
  onCopyPage: (pageNum: number, text: string) => void;
}) {
  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <div key={page.page_number} className="space-y-2">
          {/* Page header */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 border-b border-[#EDEAE4] z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-display font-bold bg-[#4A6B5A] text-white rounded-md">
                Page {page.page_number}
              </span>
              {page.images && page.images.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-display font-semibold bg-[#C4705A] text-white rounded-md">
                  <ImageIcon className="w-3 h-3" />
                  {page.images.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onCopyPage(page.page_number, page.text)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              {copiedPage === page.page_number ? (
                <>
                  <CheckIcon className="w-3 h-3 text-[#4A6B5A]" />
                  <span className="text-[#4A6B5A]">Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Page text */}
          <div className="text-sm font-body text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">
            {page.text || <span className="text-[#6B6B6B] italic">No text on this page</span>}
          </div>

          {/* Page images */}
          {page.images && page.images.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#EDEAE4]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C4705A]" />
                <span className="text-xs font-display font-semibold text-[#6B6B6B]">
                  {page.images.length} image{page.images.length > 1 ? "s" : ""} on this page
                </span>
              </div>
              <div className="grid gap-3">
                {page.images.map((image, idx) => (
                  <div key={idx} className="rounded-lg neo-border overflow-hidden bg-[#F5F2ED]">
                    <img
                      src={image.data}
                      alt={image.description || `Image ${idx + 1}`}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <div className="px-3 py-2 text-xs text-[#6B6B6B] border-t border-[#EDEAE4]">
                      <span className="font-display font-semibold">{image.description}</span>
                      {image.metadata && (
                        <span className="ml-2">
                          ({image.metadata.extracted_width}x{image.metadata.extracted_height})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function CSVContent({
  tables,
  summary
}: {
  tables: CSVExtractionResponse["tables"];
  summary: CSVExtractionResponse["summary"];
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (tableIdx: number, rowIdx: number) => {
    const key = `${tableIdx}-${rowIdx}`;
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Schema info */}
      <div className="p-4 bg-[#F5F2ED] rounded-xl neo-border">
        <div className="flex items-center gap-2 mb-3">
          <TableIcon className="w-4 h-4 text-[#4A6B5A]" />
          <span className="text-sm font-display font-bold text-[#1A1A1A]">Schema</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.columns.map((col, idx) => (
            <span
              key={col}
              className="px-2 py-1 text-xs font-mono bg-white rounded-md neo-border"
              title={`Type: ${summary.column_types[col]}`}
            >
              <span className="text-[#4A6B5A] font-semibold">{col}</span>
              <span className="text-[#6B6B6B] ml-1">({summary.column_types[col]})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tables/Pages */}
      {tables.map((table, tableIdx) => (
        <div key={tableIdx} className="space-y-3">
          {tables.length > 1 && (
            <div className="flex items-center gap-2 sticky top-0 bg-white py-2 border-b border-[#EDEAE4] z-10">
              <span className="px-2 py-1 text-xs font-display font-bold bg-[#4A6B5A] text-white rounded-md">
                Page {table.page_index + 1} of {table.total_pages}
              </span>
              <span className="text-xs text-[#6B6B6B]">
                ({table.row_count} rows)
              </span>
            </div>
          )}

          {/* Rows */}
          <div className="space-y-2">
            {table.rows.map((row, rowIdx) => {
              const key = `${tableIdx}-${rowIdx}`;
              const isExpanded = expandedRows.has(key);
              const globalRowNum = table.page_index * 500 + rowIdx + 1;

              return (
                <div
                  key={rowIdx}
                  className="rounded-lg neo-border overflow-hidden bg-white"
                >
                  <button
                    onClick={() => toggleRow(tableIdx, rowIdx)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F5F2ED] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#EDEAE4] rounded text-[#6B6B6B]">
                        #{globalRowNum}
                      </span>
                      <span className="text-sm font-body text-[#2C2C2C] truncate max-w-[280px]">
                        {Object.values(row).slice(0, 3).filter(v => v !== null).join(" • ")}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#6B6B6B] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-3 bg-[#F5F2ED] border-t border-[#EDEAE4]">
                      <div className="grid gap-2">
                        {Object.entries(row).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-xs font-mono font-semibold text-[#4A6B5A] min-w-[120px]">
                              {key}:
                            </span>
                            <span className="text-sm font-body text-[#2C2C2C] break-all">
                              {value === null ? (
                                <span className="text-[#6B6B6B] italic">null</span>
                              ) : typeof value === "boolean" ? (
                                <span className={value ? "text-[#4A6B5A]" : "text-[#B54A4A]"}>
                                  {String(value)}
                                </span>
                              ) : typeof value === "number" ? (
                                <span className="text-[#6B4A8A]">{value.toLocaleString()}</span>
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarkdownContent({ markdown, fileType }: { markdown: string; fileType: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get label based on file type
  const getLabel = () => {
    if (["csv", "xlsx"].includes(fileType)) return "Markdown Table Format";
    if (["md", "markdown"].includes(fileType)) return "Raw Markdown";
    return "Markdown Export";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display font-semibold text-[#6B6B6B]">
          {getLabel()}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer rounded-md hover:bg-[#F5F2ED]"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3 h-3 text-[#4A6B5A]" />
              <span className="text-[#4A6B5A]">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-xs font-mono text-[#2C2C2C] bg-[#F5F2ED] p-4 rounded-xl neo-border overflow-x-auto whitespace-pre">
        {markdown}
      </pre>
    </div>
  );
}

function JsonContent({ result }: { result: PDFExtractionResponse }) {
  return (
    <pre className="text-xs font-mono text-[#2C2C2C] bg-[#F5F2ED] p-4 rounded-xl neo-border overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
