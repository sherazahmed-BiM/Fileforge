"use client";

import { useRef } from "react";

// Custom SVG Icons - Matching landing page style
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
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

interface SampleFile {
  name: string;
  type: string;
  color: string;
}

const sampleFiles: SampleFile[] = [
  { name: "newsletter", type: "PDF", color: "bg-[#C4705A]" },
  { name: "realestate", type: "PDF", color: "bg-[#4A6B5A]" },
  { name: "cv", type: "PDF", color: "bg-[#6B9B8A]" },
  { name: "invoice", type: "PDF", color: "bg-[#8B7355]" },
];

interface FileSidebarProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (file: File) => void;
  onRemoveFile: (id: string) => void;
  onProcessSample: (name: string) => void;
}

export function FileSidebar({
  files,
  selectedFileId,
  onSelectFile,
  onAddFile,
}: FileSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => onAddFile(file));
    e.target.value = "";
  };

  return (
    <div className="w-64 bg-white border-r-[2.5px] border-[#2C2C2C] flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-5 border-b-[2.5px] border-[#EDEAE4]">
        <h2 className="font-display font-bold text-lg text-[#1A1A1A]">Files</h2>
        <p className="text-xs font-body text-[#6B6B6B] mt-1">
          Files are deleted when you leave this page.
        </p>
      </div>

      {/* Add file button */}
      <div className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.md,.html,.csv,.json,.xml,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileInput}
        />
        <button
          onClick={handleAddFileClick}
          className="neo-btn w-full h-11 justify-center gap-2 bg-[#C4705A] text-white font-display font-semibold rounded-xl flex items-center cursor-pointer"
        >
          Add new file
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto px-4 scrollbar-thin">
        <div className="space-y-2">
          {files.map((file) => (
            <button
              key={file.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                selectedFileId === file.id
                  ? "neo-border bg-[#C4705A]/10 neo-shadow-sm"
                  : "border-[2px] border-transparent hover:bg-[#F5F2ED]"
              }`}
              onClick={() => onSelectFile(file.id)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedFileId === file.id
                  ? "bg-[#C4705A] neo-border"
                  : "bg-[#F5F2ED] border-[2px] border-[#EDEAE4]"
              }`}>
                <FileIcon className={`h-5 w-5 ${
                  selectedFileId === file.id ? "text-white" : "text-[#6B6B6B]"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-display font-semibold truncate ${
                  selectedFileId === file.id ? "text-[#C4705A]" : "text-[#1A1A1A]"
                }`}>
                  {file.name}
                </p>
                <p className="text-xs font-body text-[#6B6B6B]">
                  {file.type.toUpperCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sample files */}
      <div className="p-4 border-t-[2.5px] border-[#EDEAE4]">
        <p className="text-label text-[#6B6B6B] mb-3 px-1">
          Try with a sample
        </p>
        <div className="space-y-2">
          {sampleFiles.map((sample) => (
            <button
              key={sample.name}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[#F5F2ED] transition-all group text-left border-[2px] border-transparent hover:border-[#EDEAE4] cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg ${sample.color} neo-border flex items-center justify-center`}>
                <FileIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-semibold text-[#1A1A1A] truncate">{sample.name}</p>
                <p className="text-xs font-body text-[#6B6B6B]">{sample.type}</p>
              </div>
              <PlayIcon className="h-3 w-3 text-[#6B6B6B] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
