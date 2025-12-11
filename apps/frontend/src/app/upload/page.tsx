"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="16" width="48" height="40" rx="8" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <path d="M32 24V48" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 34L32 24L42 34" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="8" width="28" height="8" rx="4" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2" />
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

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 10L8 14L16 6" strokeLinecap="round" strokeLinejoin="round" />
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

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

// Supported file types matching backend (UniversalExtractor)
const ACCEPTED_EXTENSIONS = [
  // Documents - Modern Office
  ".pdf", ".docx", ".xlsx", ".pptx",
  // Documents - Legacy Office (via LibreOffice)
  ".doc", ".dot", ".dotm", ".dotx", ".rtf",
  ".xls", ".xlm", ".xlt",
  ".ppt", ".pot", ".pptm", ".pps", ".ppsx",
  // Documents - Open Document Format (via LibreOffice)
  ".odt", ".ott", ".ods", ".ots", ".odp", ".otp",
  // Documents - Legacy Word Processing (via LibreOffice)
  ".abw", ".zabw", ".hwp", ".sxw", ".sxg", ".wpd", ".wps", ".cwk", ".mcw",
  // Spreadsheets - Legacy (via LibreOffice)
  ".et", ".fods", ".sxc", ".wk1", ".wks", ".dif",
  // Presentations - Legacy (via LibreOffice)
  ".sxi",
  // Markup
  ".html", ".htm", ".xhtml", ".md", ".markdown", ".adoc", ".asciidoc", ".rst", ".org",
  // Data
  ".csv", ".tsv", ".json", ".xml", ".dbf",
  // Images (OCR supported)
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".tif", ".webp", ".heic", ".heif",
  // Email
  ".eml", ".msg", ".p7s",
  // Ebooks
  ".epub",
  // Audio (transcription via Whisper ASR)
  ".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"
];

const ACCEPTED_MIME_TYPES = [
  // Documents - Modern Office
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Documents - Legacy Office
  "application/msword",
  "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  // Documents - Open Document Format
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  // Markup
  "text/html",
  "application/xhtml+xml",
  "text/markdown",
  "text/asciidoc",
  // Data
  "text/csv",
  "text/tab-separated-values",
  "application/json",
  "application/xml",
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/webp",
  "image/heic",
  "image/heif",
  // Email
  "message/rfc822",
  "application/vnd.ms-outlook",
  // Ebooks
  "application/epub+zip",
  // Audio (transcription via Whisper ASR)
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/flac",
  "audio/ogg",
  "audio/webm"
];

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toUpperCase() || "FILE";
  };

  const isValidFile = (file: File): boolean => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(extension) || ACCEPTED_MIME_TYPES.includes(file.type);
  };

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      setUploadedFile({
        file,
        id: crypto.randomUUID(),
        status: "error",
        progress: 0,
        error: "Unsupported file type"
      });
      return;
    }

    const newFile: UploadedFile = {
      file,
      id: crypto.randomUUID(),
      status: "uploading",
      progress: 0
    };

    setUploadedFile(newFile);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFile(prev => prev ? { ...prev, status: "completed", progress: 100 } : null);
      } else {
        setUploadedFile(prev => prev ? { ...prev, progress } : null);
      }
    }, 200);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
    e.target.value = "";
  }, [handleFile]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleContinue = () => {
    if (!uploadedFile || uploadedFile.status !== "completed") return;

    setIsNavigating(true);

    // Store file in sessionStorage for the transform page
    const fileData = {
      name: uploadedFile.file.name,
      type: uploadedFile.file.type,
      size: uploadedFile.file.size,
      id: uploadedFile.id
    };
    sessionStorage.setItem("pendingUpload", JSON.stringify(fileData));

    // Create object URL and store it
    const objectUrl = URL.createObjectURL(uploadedFile.file);
    sessionStorage.setItem("pendingUploadUrl", objectUrl);

    // Store the actual file in a global variable (sessionStorage can't store File objects)
    (window as typeof window & { __pendingFile?: File }).__pendingFile = uploadedFile.file;

    router.push("/transform");
  };

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b-[2.5px] border-[#2C2C2C] bg-[#FAF8F5] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="h-10 w-10 rounded-xl neo-border bg-white hover:bg-[#F5F2ED] flex items-center justify-center transition-colors neo-shadow-sm cursor-pointer"
          >
            <CloseIcon className="h-5 w-5 text-[#2C2C2C]" />
          </button>
          <div className="flex items-center gap-3">
            <LogoMark className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
              Upload
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] mb-3">
              Upload Your File
            </h1>
            <p className="text-lg font-body text-[#6B6B6B]">
              Drop a file to transform it into LLM-ready structured data
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!uploadedFile ? handleBrowseClick : undefined}
            className={`
              relative rounded-2xl border-[3px] border-dashed p-12 text-center transition-all
              ${!uploadedFile ? "cursor-pointer" : ""}
              ${isDragging
                ? "border-[#C4705A] bg-[#C4705A]/5"
                : uploadedFile
                  ? "border-[#4A6B5A] bg-[#4A6B5A]/5"
                  : "border-[#2C2C2C]/30 hover:border-[#C4705A]/50 hover:bg-[#F5F2ED]"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleFileInput}
            />

            {!uploadedFile ? (
              /* Empty State */
              <div className="flex flex-col items-center gap-6">
                <div className={`
                  w-20 h-20 rounded-2xl neo-border flex items-center justify-center transition-colors
                  ${isDragging ? "bg-[#C4705A]/10" : "bg-[#F5F2ED]"}
                `}>
                  <UploadIcon className="w-12 h-12" />
                </div>

                <div>
                  <p className="text-xl font-display font-semibold text-[#1A1A1A] mb-2">
                    {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm font-body text-[#6B6B6B]">
                    or click to browse from your computer
                  </p>
                </div>

                <button className="neo-btn bg-[#C4705A] text-white px-6 py-3 text-sm font-display font-semibold cursor-pointer">
                  Select File
                </button>

                <p className="text-xs font-body text-[#6B6B6B]">
                  Supports PDF, DOCX, XLSX, TXT, Images, and more (max 100MB)
                </p>
              </div>
            ) : (
              /* File Uploaded State */
              <div className="flex flex-col items-center gap-6">
                {/* File Card */}
                <div className="w-full max-w-md neo-card p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-14 h-14 rounded-xl neo-border flex items-center justify-center shrink-0
                      ${uploadedFile.status === "completed" ? "bg-[#4A6B5A]" : uploadedFile.status === "error" ? "bg-[#B54A4A]" : "bg-[#C4705A]"}
                    `}>
                      {uploadedFile.status === "uploading" ? (
                        <LoadingSpinner className="w-6 h-6 text-white" />
                      ) : uploadedFile.status === "completed" ? (
                        <CheckmarkIcon className="w-6 h-6 text-white" />
                      ) : uploadedFile.status === "error" ? (
                        <CloseIcon className="w-6 h-6 text-white" />
                      ) : (
                        <FileIcon className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-base font-display font-semibold text-[#1A1A1A] truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm font-body text-[#6B6B6B]">
                        {getFileExtension(uploadedFile.file.name)} • {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-[#F5F2ED] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <CloseIcon className="w-4 h-4 text-[#6B6B6B]" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {uploadedFile.status === "uploading" && (
                    <div className="mt-4">
                      <div className="h-2 bg-[#EDEAE4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C4705A] transition-all duration-300 ease-out rounded-full"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs font-body text-[#6B6B6B] mt-2">
                        Uploading... {Math.round(uploadedFile.progress)}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadedFile.status === "error" && uploadedFile.error && (
                    <p className="text-sm font-body text-[#B54A4A] mt-3">
                      {uploadedFile.error}
                    </p>
                  )}

                  {/* Success Message */}
                  {uploadedFile.status === "completed" && (
                    <p className="text-sm font-body text-[#4A6B5A] mt-3">
                      Ready to transform
                    </p>
                  )}
                </div>

                {/* Continue Button */}
                {uploadedFile.status === "completed" && (
                  <button
                    onClick={handleContinue}
                    disabled={isNavigating}
                    className="neo-btn bg-[#4A6B5A] text-white px-8 py-4 text-base font-display font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <>
                        <LoadingSpinner className="w-5 h-5" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Continue to Transform
                        <ArrowRightIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {/* Upload Another */}
                {uploadedFile.status === "error" && (
                  <button
                    onClick={handleRemoveFile}
                    className="neo-btn-outline px-6 py-3 text-sm font-display font-semibold text-[#2C2C2C] cursor-pointer"
                  >
                    Try Another File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Supported Formats */}
          <div className="mt-8 text-center">
            <p className="text-sm font-body text-[#6B6B6B] mb-3">Supported formats</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["PDF", "DOCX", "DOC", "XLSX", "XLS", "PPTX", "PPT", "ODT", "ODS", "HTML", "CSV", "EML", "EPUB", "PNG", "JPG"].map((format) => (
                <span
                  key={format}
                  className="px-3 py-1.5 text-xs font-display font-semibold bg-[#F5F2ED] border-[2px] border-[#EDEAE4] rounded-lg text-[#6B6B6B]"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
