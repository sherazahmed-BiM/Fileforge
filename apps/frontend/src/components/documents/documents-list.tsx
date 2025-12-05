"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentCard } from "./document-card";
import type { Document } from "@/types";

// Custom SVG Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

interface DocumentsListProps {
  documents: Document[];
  isLoading?: boolean;
  onDelete?: (id: number) => void;
  onReprocess?: (id: number) => void;
}

export function DocumentsList({
  documents,
  isLoading,
  onDelete,
  onReprocess,
}: DocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredDocuments = documents.filter((doc) =>
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 w-full rounded-2xl bg-white neo-border-2 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl neo-border-2 bg-white font-medium text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#E91E8C] transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl neo-border-2 bg-white">
          <button
            onClick={() => setViewMode("list")}
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
              viewMode === "list"
                ? "bg-[#E91E8C] text-white neo-shadow-sm"
                : "text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
              viewMode === "grid"
                ? "bg-[#E91E8C] text-white neo-shadow-sm"
                : "text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            <GridIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-24 h-24 rounded-2xl bg-[#f1f5f9] neo-border-2 flex items-center justify-center mb-6">
            <FileIcon className="h-12 w-12 text-[#94a3b8]" />
          </div>
          <h3 className="text-2xl font-black text-[#0f172a]">No documents found</h3>
          <p className="text-[#64748b] font-medium mt-2">
            {searchQuery
              ? "Try adjusting your search query"
              : "Upload your first file to get started"}
          </p>
        </motion.div>
      )}

      {/* Documents grid/list */}
      <AnimatePresence mode="popLayout">
        <motion.div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredDocuments.map((document, index) => (
            <motion.div
              key={document.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <DocumentCard
                document={document}
                onDelete={onDelete}
                onReprocess={onReprocess}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
