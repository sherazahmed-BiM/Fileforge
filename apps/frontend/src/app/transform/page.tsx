"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileSidebar } from "@/components/transform/file-sidebar";
import { FilePreview } from "@/components/transform/file-preview";
import { ResultPanel } from "@/components/transform/result-panel";
import { convertFileSync, getDocumentLLM } from "@/lib/api";
import type { LLMReadyResponse } from "@/types";

// Custom SVG Icons - Matching landing page style
function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="8" y="12" width="24" height="20" rx="3" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="5" y="8" width="24" height="20" rx="3" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="2" y="4" width="24" height="20" rx="3" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <line x1="6" y1="10" x2="18" y2="10" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="14" x2="22" y2="14" stroke="#C4705A" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="18" x2="16" y2="18" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 10H16M16 10L11 5M16 10L11 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  file?: File;
  objectUrl?: string;
}

export default function TransformPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [result, setResult] = useState<LLMReadyResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const document = await convertFileSync(file, {
        chunk_strategy: "semantic",
        chunk_size: 1000,
        chunk_overlap: 100,
      });

      const llmResult = await getDocumentLLM(document.id);
      setResult(llmResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddFile = useCallback((file: File) => {
    const id = crypto.randomUUID();
    const extension = file.name.split(".").pop() || "";
    const objectUrl = URL.createObjectURL(file);

    const newFile: FileItem = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: extension,
      file,
      objectUrl,
    };

    setFiles((prev) => [...prev, newFile]);
    setSelectedFileId(id);
    setResult(null);
    setError(null);

    processFile(file);
  }, []);

  const handleRemoveFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file?.objectUrl) {
        URL.revokeObjectURL(file.objectUrl);
      }

      setFiles((prev) => prev.filter((f) => f.id !== id));

      if (selectedFileId === id) {
        setSelectedFileId(null);
        setResult(null);
        setError(null);
      }
    },
    [files, selectedFileId]
  );

  const handleSelectFile = useCallback(
    (id: string) => {
      setSelectedFileId(id);
      setResult(null);
      setError(null);

      const file = files.find((f) => f.id === id);
      if (file?.file) {
        processFile(file.file);
      }
    },
    [files]
  );

  const handleProcessSample = useCallback((sampleName: string) => {
    setError(`Sample file "${sampleName}" - Coming soon`);
  }, []);

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAF8F5] overflow-hidden">
      {/* Top bar - matching landing page nav style */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[2.5px] border-[#2C2C2C] bg-[#FAF8F5] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="h-10 w-10 rounded-xl neo-border bg-white hover:bg-[#F5F2ED] flex items-center justify-center transition-colors neo-shadow-sm"
          >
            <CloseIcon className="h-5 w-5 text-[#2C2C2C]" />
          </button>
          <div className="flex items-center gap-3">
            <LogoMark className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
              Transform
            </span>
          </div>
        </div>
        <button className="neo-btn bg-[#4A6B5A] text-white px-5 py-2.5 text-sm font-display font-semibold flex items-center gap-2 cursor-pointer">
          Edit in Workflow Editor
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* File sidebar */}
        <FileSidebar
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
          onAddFile={handleAddFile}
          onRemoveFile={handleRemoveFile}
          onProcessSample={handleProcessSample}
        />

        {/* File preview */}
        <FilePreview
          fileUrl={selectedFile?.objectUrl || null}
          fileName={selectedFile?.name || null}
          fileType={selectedFile?.type || null}
          totalPages={result?.metadata?.page_count || 1}
        />

        {/* Result panel */}
        <ResultPanel
          result={result}
          isLoading={isProcessing}
          error={error}
        />
      </div>
    </div>
  );
}
