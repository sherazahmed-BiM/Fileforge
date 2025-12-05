"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Document, DocumentStatus } from "@/types";
import { formatDistanceToNow } from "@/lib/format";

// Custom SVG Icons
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="12" r="2" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,10 17,10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: number) => void;
  onReprocess?: (id: number) => void;
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { icon: typeof CheckIcon; color: string; bgColor: string; label: string }
> = {
  completed: { icon: CheckIcon, color: "text-[#10B981]", bgColor: "bg-[#10B981]", label: "Completed" },
  processing: { icon: LoaderIcon, color: "text-[#2563EB]", bgColor: "bg-[#2563EB]", label: "Processing" },
  pending: { icon: ClockIcon, color: "text-[#F59E0B]", bgColor: "bg-[#F59E0B]", label: "Pending" },
  failed: { icon: AlertIcon, color: "text-[#ef4444]", bgColor: "bg-[#ef4444]", label: "Failed" },
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-[#E91E8C]",
  docx: "bg-[#2563EB]",
  doc: "bg-[#2563EB]",
  xlsx: "bg-[#10B981]",
  xls: "bg-[#10B981]",
  csv: "bg-[#10B981]",
  pptx: "bg-[#F59E0B]",
  ppt: "bg-[#F59E0B]",
  txt: "bg-[#64748b]",
  markdown: "bg-[#64748b]",
  html: "bg-[#8B5CF6]",
  json: "bg-[#06B6D4]",
  xml: "bg-[#06B6D4]",
  image: "bg-[#F97316]",
};

export function DocumentCard({ document, onDelete, onReprocess }: DocumentCardProps) {
  const statusConfig = STATUS_CONFIG[document.status];
  const StatusIcon = statusConfig.icon;
  const fileColor = FILE_TYPE_COLORS[document.file_type] || "bg-[#64748b]";

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="neo-card bg-white p-5 group">
        <div className="flex items-start justify-between gap-4">
          {/* File icon and info */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className={`w-14 h-14 rounded-xl ${fileColor} neo-border-2 flex items-center justify-center shrink-0`}>
              <FileIcon className="h-7 w-7 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/documents/${document.id}`}
                className="block truncate font-bold text-[#0f172a] hover:text-[#E91E8C] transition-colors"
              >
                {document.original_filename}
              </Link>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#64748b] font-medium">
                <span>{formatFileSize(document.file_size_bytes)}</span>
                <span className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
                <span className="uppercase font-bold">{document.file_type}</span>
                <span className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
                <span>{formatDistanceToNow(document.created_at)}</span>
              </div>

              {/* Stats for completed documents */}
              {document.status === "completed" && document.total_chunks && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#f1f5f9] neo-border-2 text-xs font-bold text-[#0f172a]">
                    {document.total_chunks} chunks
                  </span>
                  {document.total_tokens && (
                    <span className="px-3 py-1 rounded-lg bg-[#f1f5f9] neo-border-2 text-xs font-bold text-[#0f172a]">
                      {document.total_tokens.toLocaleString()} tokens
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-lg bg-[#E91E8C]/10 border-2 border-[#E91E8C]/30 text-xs font-bold text-[#E91E8C] capitalize">
                    {document.chunk_strategy}
                  </span>
                </div>
              )}

              {/* Error message for failed documents */}
              {document.status === "failed" && document.error_message && (
                <p className="mt-2 text-xs text-[#ef4444] font-medium line-clamp-2">
                  {document.error_message}
                </p>
              )}
            </div>
          </div>

          {/* Status and actions */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg neo-border-2 ${statusConfig.color}`}>
              <StatusIcon
                className={`h-4 w-4 ${
                  document.status === "processing" ? "animate-spin" : ""
                }`}
              />
              <span className="text-xs font-bold">{statusConfig.label}</span>
            </div>

            {/* Actions dropdown */}
            <div className="relative group/menu">
              <button className="h-10 w-10 rounded-lg neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <MoreIcon className="h-5 w-5 text-[#64748b]" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl neo-border-2 neo-shadow opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                <Link
                  href={`/documents/${document.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  View Details
                </Link>

                {document.status === "completed" && (
                  <Link
                    href={`/documents/${document.id}?tab=export`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Export
                  </Link>
                )}

                {document.status === "failed" && onReprocess && (
                  <button
                    onClick={() => onReprocess(document.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <RefreshIcon className="h-4 w-4" />
                    Reprocess
                  </button>
                )}

                <div className="my-2 border-t border-[#e2e8f0]" />

                <button
                  onClick={() => onDelete?.(document.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
