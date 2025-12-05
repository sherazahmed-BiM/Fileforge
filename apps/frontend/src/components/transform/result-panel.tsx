"use client";

import { useState } from "react";
import type { LLMReadyResponse } from "@/types";

// Custom SVG Icons - Matching landing page style
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
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

interface ResultPanelProps {
  result: LLMReadyResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function ResultPanel({ result, isLoading, error }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"formatted" | "json">("formatted");

  const handleDownload = () => {
    if (!result) return;
    const content = JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.filename.replace(/\.[^/.]+$/, "")}_llm.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Empty state
  if (!result && !isLoading && !error) {
    return (
      <div className="w-[480px] bg-white border-l-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
        <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4]">
          <h3 className="font-display font-bold text-[#1A1A1A]">Result</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F5F2ED] neo-border flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-[#6B6B6B]" />
            </div>
            <p className="text-[#1A1A1A] font-display font-bold text-lg">No results yet</p>
            <p className="text-sm font-body text-[#6B6B6B] mt-1">
              Upload a file to see LLM-ready output
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
          <h3 className="font-display font-bold text-[#1A1A1A]">Result</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#FEF2F2] neo-border border-[#B54A4A] flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-10 h-10 text-[#B54A4A]" />
            </div>
            <p className="text-[#1A1A1A] font-display font-bold text-lg">Error processing file</p>
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
          <h3 className="font-display font-bold text-[#1A1A1A]">Result</h3>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#C4705A] animate-pulse" />
            <span className="text-sm font-body text-[#6B6B6B]">Processing file...</span>
          </div>
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-4 w-2/3 bg-[#F5F2ED] rounded-lg animate-pulse" />
            <div className="h-8 w-1/2 bg-[#F5F2ED] rounded-lg animate-pulse mt-6" />
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
        <h3 className="font-display font-bold text-[#1A1A1A]">Result</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="h-9 w-9 rounded-lg neo-border bg-white hover:bg-[#F5F2ED] flex items-center justify-center transition-colors cursor-pointer"
          >
            <DownloadIcon className="h-4 w-4 text-[#2C2C2C]" />
          </button>
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-[#F5F2ED] p-1 neo-border">
            <button
              className={`px-4 py-1.5 text-sm font-display font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "formatted"
                  ? "bg-white text-[#1A1A1A] neo-shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
              onClick={() => setActiveTab("formatted")}
            >
              Formatted
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
            LLM-ready output generated
          </span>
        </div>
        <button className="neo-btn h-8 px-4 bg-[#C4705A] text-white text-sm font-display font-semibold rounded-lg cursor-pointer">
          Refine
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0 p-6 scrollbar-thin">
        {activeTab === "formatted" ? (
          <FormattedContent result={result!} />
        ) : (
          <JsonContent result={result!} />
        )}
      </div>
    </div>
  );
}

function FormattedContent({ result }: { result: LLMReadyResponse }) {
  return (
    <div className="space-y-4">
      {result.content.chunks.map((chunk, index) => {
        const isTitle = chunk.metadata.element_category === "Title";
        const isHeading = chunk.metadata.element_category === "Header" ||
                          chunk.metadata.element_category === "Section";

        if (isTitle) {
          return (
            <h2 key={index} className="text-xl font-display font-bold text-[#1A1A1A] leading-tight">
              {chunk.text}
            </h2>
          );
        }

        if (isHeading) {
          return (
            <h3 key={index} className="text-lg font-display font-semibold text-[#1A1A1A] mt-6 leading-tight">
              {chunk.text}
            </h3>
          );
        }

        return (
          <p key={index} className="text-sm font-body text-[#6B6B6B] leading-relaxed">
            {chunk.text}
          </p>
        );
      })}
    </div>
  );
}

function JsonContent({ result }: { result: LLMReadyResponse }) {
  return (
    <pre className="text-xs font-mono text-[#2C2C2C] bg-[#F5F2ED] p-4 rounded-xl neo-border overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
