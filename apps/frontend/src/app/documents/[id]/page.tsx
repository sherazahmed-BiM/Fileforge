"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChunkViewer } from "@/components/documents";
import { useDocument, useDocumentChunks } from "@/hooks/use-documents";
import { formatDistanceToNow, formatFileSize, formatDuration } from "@/lib/format";
import { getDocumentLLM } from "@/lib/api";

// Custom SVG Icons
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  );
}

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

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 2,7 12,12 22,7" />
      <polyline points="2,17 12,22 22,17" />
      <polyline points="2,12 12,17 22,12" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const documentId = parseInt(id, 10);

  const { data: document, isLoading: docLoading } = useDocument(documentId);
  const { data: chunks, isLoading: chunksLoading } = useDocumentChunks(documentId);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"chunks" | "metadata" | "raw">("chunks");

  const handleExportJSON = async () => {
    try {
      const data = await getDocumentLLM(documentId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document?.original_filename || "document"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
    }
  };

  const handleCopyJSON = async () => {
    try {
      const data = await getDocumentLLM(documentId);
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (docLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <div className="h-20 border-b-3 border-[#0f172a] bg-white" />
        <div className="p-8 space-y-4 max-w-7xl mx-auto w-full">
          <div className="h-32 w-full rounded-2xl bg-white neo-border-2 animate-pulse" />
          <div className="h-64 w-full rounded-2xl bg-white neo-border-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <header className="border-b-3 border-[#0f172a] bg-white">
          <div className="max-w-7xl mx-auto px-8 h-20 flex items-center">
            <Link
              href="/documents"
              className="h-10 w-10 rounded-xl neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-[#f1f5f9] neo-border-2 flex items-center justify-center mx-auto mb-6">
              <FileIcon className="h-12 w-12 text-[#94a3b8]" />
            </div>
            <h2 className="text-2xl font-black text-[#0f172a]">Document not found</h2>
            <p className="text-[#64748b] font-medium mt-2">
              The document you're looking for doesn't exist.
            </p>
            <Link
              href="/documents"
              className="neo-btn inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#E91E8C] text-white font-bold rounded-xl"
            >
              Back to Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "File Size",
      value: formatFileSize(document.file_size_bytes),
      icon: FileIcon,
      color: "bg-[#E91E8C]",
    },
    {
      label: "Chunks",
      value: document.total_chunks?.toString() || "—",
      icon: LayersIcon,
      color: "bg-[#2563EB]",
    },
    {
      label: "Tokens",
      value: document.total_tokens?.toLocaleString() || "—",
      icon: HashIcon,
      color: "bg-[#10B981]",
    },
    {
      label: "Processing Time",
      value: document.processing_duration_ms
        ? formatDuration(document.processing_duration_ms)
        : "—",
      icon: ClockIcon,
      color: "bg-[#F59E0B]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col relative">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b-3 border-[#0f172a] bg-white">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/documents"
              className="h-10 w-10 rounded-xl neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-black text-xl text-[#0f172a] truncate max-w-md">
                {document.original_filename}
              </h1>
              <p className="text-sm text-[#64748b] font-medium">
                Uploaded {formatDistanceToNow(document.created_at)}
              </p>
            </div>
          </div>

          {document.status === "completed" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyJSON}
                className="neo-btn h-10 px-4 gap-2 bg-white text-[#0f172a] font-bold rounded-xl flex items-center"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-[#10B981]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4" />
                    Copy JSON
                  </>
                )}
              </button>
              <button
                onClick={handleExportJSON}
                className="neo-btn h-10 px-4 gap-2 bg-[#E91E8C] text-white font-bold rounded-xl flex items-center"
              >
                <DownloadIcon className="h-4 w-4" />
                Export
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="neo-card bg-white p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} neo-border-2 flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b] font-medium">{stat.label}</p>
                      <p className="text-2xl font-black text-[#0f172a]">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex gap-2 p-1 rounded-xl neo-border-2 bg-white w-fit">
              {(["chunks", "metadata", "raw"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg font-bold text-sm capitalize transition-all ${
                    activeTab === tab
                      ? "bg-[#E91E8C] text-white neo-shadow-sm"
                      : "text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "chunks" && (
              chunksLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 w-full rounded-2xl bg-white neo-border-2 animate-pulse" />
                  ))}
                </div>
              ) : chunks && chunks.length > 0 ? (
                <ChunkViewer chunks={chunks} totalTokens={document.total_tokens} />
              ) : (
                <div className="neo-card bg-white p-8 text-center">
                  <p className="text-[#64748b] font-medium">No chunks available</p>
                </div>
              )
            )}

            {activeTab === "metadata" && (
              <div className="neo-card bg-white p-6">
                <h3 className="font-black text-xl text-[#0f172a] mb-6">Document Metadata</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetadataItem label="File Type" value={document.file_type.toUpperCase()} />
                  <MetadataItem label="MIME Type" value={document.mime_type || "—"} />
                  <MetadataItem label="File Hash" value={document.file_hash.slice(0, 16) + "..."} />
                  <MetadataItem label="Status" value={document.status} />
                  <MetadataItem label="Chunk Strategy" value={document.chunk_strategy} />
                  <MetadataItem label="Chunk Size" value={document.chunk_size.toString()} />
                  <MetadataItem label="Chunk Overlap" value={document.chunk_overlap.toString()} />
                  <MetadataItem
                    label="Raw Text Length"
                    value={document.raw_text_length?.toLocaleString() || "—"}
                  />
                </div>

                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold text-[#0f172a] mb-4">Extracted Metadata</h4>
                    <pre className="rounded-xl bg-[#f8fafc] neo-border-2 p-4 text-sm overflow-auto font-mono text-[#334155]">
                      {JSON.stringify(document.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "raw" && (
              <div className="neo-card bg-white p-6">
                <h3 className="font-black text-xl text-[#0f172a] mb-4">Raw Text</h3>
                <p className="text-sm text-[#64748b] font-medium">
                  Raw text is not stored in the API response. Use the chunks view
                  to see the processed content.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b-2 border-[#e2e8f0] last:border-0">
      <span className="text-sm text-[#64748b] font-medium">{label}</span>
      <span className="text-sm font-bold text-[#0f172a] capitalize">{value}</span>
    </div>
  );
}
