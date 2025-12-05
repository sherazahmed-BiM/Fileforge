"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Chunk } from "@/types";

// Custom SVG Icons
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="18,15 12,9 6,15" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

interface ChunkViewerProps {
  chunks: Chunk[];
  totalTokens?: number;
}

export function ChunkViewer({ chunks, totalTokens }: ChunkViewerProps) {
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleChunk = (index: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedChunks(new Set(chunks.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedChunks(new Set());
  };

  const copyChunk = async (chunk: Chunk) => {
    await navigator.clipboard.writeText(chunk.text);
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllChunks = async () => {
    const text = chunks.map((c) => c.text).join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB]/10 neo-border-2 border-[#2563EB]/30">
            <HashIcon className="h-4 w-4 text-[#2563EB]" />
            <span className="text-sm font-bold text-[#2563EB]">{chunks.length} chunks</span>
          </div>
          {totalTokens && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981]/10 neo-border-2 border-[#10B981]/30">
              <FileIcon className="h-4 w-4 text-[#10B981]" />
              <span className="text-sm font-bold text-[#10B981]">{totalTokens.toLocaleString()} tokens</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="neo-btn h-9 px-4 bg-white text-[#0f172a] font-bold text-sm rounded-lg"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="neo-btn h-9 px-4 bg-white text-[#0f172a] font-bold text-sm rounded-lg"
          >
            Collapse All
          </button>
          <button
            onClick={copyAllChunks}
            className="neo-btn h-9 px-4 gap-2 bg-[#E91E8C] text-white font-bold text-sm rounded-lg flex items-center"
          >
            <CopyIcon className="h-4 w-4" />
            Copy All
          </button>
        </div>
      </div>

      {/* Chunks list */}
      <div className="h-[600px] rounded-2xl neo-border-2 bg-white overflow-hidden">
        <div className="h-full overflow-auto p-4 space-y-3 scrollbar-thin">
          {chunks.map((chunk, index) => {
            const isExpanded = expandedChunks.has(index);
            const previewText = chunk.text.slice(0, 200);
            const hasMore = chunk.text.length > 200;

            return (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className={`neo-card bg-[#FFFBF5] p-4 ${isExpanded ? "ring-2 ring-[#E91E8C]/50" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-[#E91E8C] text-white text-xs font-bold neo-border-2">
                        #{chunk.index + 1}
                      </span>
                      {chunk.element_category && (
                        <span className="px-3 py-1 rounded-lg bg-[#f1f5f9] neo-border-2 text-xs font-bold text-[#0f172a]">
                          {chunk.element_category}
                        </span>
                      )}
                      {chunk.source_page && (
                        <span className="px-3 py-1 rounded-lg bg-[#f1f5f9] neo-border-2 text-xs font-bold text-[#0f172a]">
                          Page {chunk.source_page}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] font-medium">
                        {chunk.token_count} tokens
                      </span>

                      <button
                        onClick={() => copyChunk(chunk)}
                        className="h-8 w-8 rounded-lg neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center transition-colors"
                      >
                        {copiedId === chunk.id ? (
                          <CheckIcon className="h-4 w-4 text-[#10B981]" />
                        ) : (
                          <CopyIcon className="h-4 w-4 text-[#64748b]" />
                        )}
                      </button>

                      {hasMore && (
                        <button
                          onClick={() => toggleChunk(index)}
                          className="h-8 w-8 rounded-lg neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4 text-[#64748b]" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-[#64748b]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isExpanded ? "expanded" : "collapsed"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-[#475569] font-medium leading-relaxed"
                    >
                      <pre className="whitespace-pre-wrap font-sans">
                        {isExpanded || !hasMore ? chunk.text : `${previewText}...`}
                      </pre>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
