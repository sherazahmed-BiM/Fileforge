"use client";

import { useState } from "react";
import type { PDFExtractionResponse } from "@/types";

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
}

export function TextResultPanel({ result, isLoading, error }: TextResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"text" | "json">("text");
  const [copiedPage, setCopiedPage] = useState<number | null>(null);

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
    const allText = result.pages.map(p => p.text).join("\n\n---\n\n");
    await navigator.clipboard.writeText(allText);
    setCopiedPage(-1); // -1 indicates "all"
    setTimeout(() => setCopiedPage(null), 2000);
  };

  // Empty state
  if (!result && !isLoading && !error) {
    return (
      <div className="w-[480px] bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
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
      <div className="w-[480px] bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
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
      <div className="w-[480px] bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
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
    <div className="w-[480px] bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0 overflow-hidden">
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
              className={`px-4 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "text"
                  ? "bg-white text-[#1A1A1A] neo-shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
              onClick={() => setActiveTab("text")}
            >
              Text
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
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
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#4A6B5A] flex items-center justify-center">
            <CheckmarkIcon className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-display font-semibold text-[#1A1A1A]">
            {result!.statistics.page_count} pages, {result!.statistics.word_count.toLocaleString()} words
            {result!.statistics.image_count > 0 && `, ${result!.statistics.image_count} images`}
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
        {activeTab === "text" ? (
          <TextContent
            pages={result!.pages}
            copiedPage={copiedPage}
            onCopyPage={handleCopyPage}
          />
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

function TextContent({
  pages,
  copiedPage,
  onCopyPage
}: {
  pages: PDFExtractionResponse["pages"];
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

function JsonContent({ result }: { result: PDFExtractionResponse }) {
  return (
    <pre className="text-xs font-mono text-[#2C2C2C] bg-[#F5F2ED] p-4 rounded-xl neo-border overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
