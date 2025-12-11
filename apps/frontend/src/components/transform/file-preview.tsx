"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// Dynamically import mammoth for DOCX conversion (only on client)
let mammoth: typeof import("mammoth") | null = null;
if (typeof window !== "undefined") {
  import("mammoth").then((mod) => {
    mammoth = mod;
  });
}


// Set up PDF.js worker (only runs on client)
if (typeof window !== "undefined") {
  import("react-pdf").then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

// Custom SVG Icons - Matching landing page style
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

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

interface FilePreviewProps {
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  totalPages?: number;
}

export function FilePreview({
  fileUrl,
  fileName,
  fileType,
}: FilePreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // DOCX preview state
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState<boolean>(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  // Measure container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 64); // subtract padding
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Track current page based on scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const scrollCenter = containerTop + containerHeight / 3;

      // Find which page is most visible
      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          const pageTop = pageEl.offsetTop;
          const pageBottom = pageTop + pageEl.clientHeight;

          if (scrollCenter >= pageTop && scrollCenter < pageBottom) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [numPages]);

  // Convert DOCX to HTML when file changes
  useEffect(() => {
    const isDocx = fileType?.toLowerCase() === "docx";
    
    if (!isDocx || !fileUrl) {
      setDocxHtml(null);
      setDocxError(null);
      return;
    }

    const convertDocx = async () => {
      if (!mammoth) {
        // Wait for mammoth to load
        const mod = await import("mammoth");
        mammoth = mod;
      }

      setDocxLoading(true);
      setDocxError(null);
      setDocxHtml(null);

      try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Heading 4'] => h4:fresh",
              "p[style-name='Heading 5'] => h5:fresh",
              "p[style-name='Heading 6'] => h6:fresh",
            ],
          }
        );

        setDocxHtml(result.value);
        if (result.messages.length > 0) {
          console.warn("DOCX conversion warnings:", result.messages);
        }
      } catch (error) {
        console.error("Failed to convert DOCX:", error);
        setDocxError(error instanceof Error ? error.message : "Failed to load DOCX");
      } finally {
        setDocxLoading(false);
      }
    };

    convertDocx();
  }, [fileUrl, fileType]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  }, []);

  const scrollToPage = (pageNum: number) => {
    const pageEl = pageRefs.current[pageNum - 1];
    if (pageEl && scrollContainerRef.current) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  if (!fileUrl) {
    return (
      <div className="flex-1 flex flex-col bg-[#F5F2ED]">
        <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4] bg-white">
          <h3 className="font-display font-bold text-[#1A1A1A]">Preview</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-body text-[#6B6B6B]">Show bounding boxes</span>
            <button
              disabled
              className="w-12 h-6 rounded-full bg-[#EDEAE4] relative opacity-50 cursor-not-allowed"
            >
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white neo-border" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EDEAE4] neo-border flex items-center justify-center mx-auto mb-4">
              <FileIcon className="w-10 h-10 text-[#6B6B6B]" />
            </div>
            <p className="text-[#1A1A1A] font-display font-bold text-lg">No file selected</p>
            <p className="text-sm font-body text-[#6B6B6B] mt-1">
              Upload a file to preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPdf = fileType?.toLowerCase() === "pdf";
  const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "tiff"].includes(
    fileType?.toLowerCase() || ""
  );
  const isDocx = fileType?.toLowerCase() === "docx";

  return (
    <div className="flex-1 flex flex-col bg-[#F5F2ED] min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b-[2.5px] border-[#EDEAE4] bg-white shrink-0">
        <h3 className="font-display font-bold text-[#1A1A1A]">Preview</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-body text-[#6B6B6B]">Show bounding boxes</span>
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
              showBoundingBoxes ? "bg-[#C4705A]" : "bg-[#EDEAE4]"
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white neo-border transition-all ${
              showBoundingBoxes ? "left-7" : "left-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Navigation panel - left side */}
        <div className="flex flex-col items-center justify-center w-16 shrink-0 gap-3">
          {isPdf && numPages > 1 && (
            <>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className={`w-9 h-9 rounded-lg neo-border flex items-center justify-center transition-colors ${
                  currentPage <= 1
                    ? "bg-[#EDEAE4] text-[#A0A0A0] cursor-not-allowed"
                    : "bg-white hover:bg-[#F5F2ED] text-[#2C2C2C] cursor-pointer"
                }`}
              >
                <ChevronUpIcon className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="text-sm font-display font-bold text-[#1A1A1A]">
                  {currentPage}
                </div>
                <div className="text-xs font-body text-[#6B6B6B]">
                  of {numPages}
                </div>
              </div>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className={`w-9 h-9 rounded-lg neo-border flex items-center justify-center transition-colors ${
                  currentPage >= numPages
                    ? "bg-[#EDEAE4] text-[#A0A0A0] cursor-not-allowed"
                    : "bg-white hover:bg-[#F5F2ED] text-[#2C2C2C] cursor-pointer"
                }`}
              >
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Document preview - fills remaining space */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
        >
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 pt-8 pr-8 pb-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="w-full flex flex-col items-center gap-4">
              {isPdf ? (
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <LoadingSpinner className="w-10 h-10 text-[#C4705A] mx-auto mb-3" />
                        <p className="text-sm font-body text-[#6B6B6B]">Loading PDF...</p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] neo-border flex items-center justify-center mx-auto mb-4">
                          <FileIcon className="w-8 h-8 text-[#B54A4A]" />
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]">Failed to load PDF</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">Please try again</p>
                      </div>
                    </div>
                  }
                  className="flex flex-col items-center gap-4"
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      ref={(el) => { pageRefs.current[index] = el; }}
                    >
                      <Page
                        pageNumber={index + 1}
                        width={containerWidth}
                        loading={
                          <div className="flex items-center justify-center bg-white" style={{ minHeight: 400, width: containerWidth }}>
                            <LoadingSpinner className="w-8 h-8 text-[#C4705A]" />
                          </div>
                        }
                        className="shadow-lg"
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                  ))}
                </Document>
              ) : isImage ? (
                <div className="flex-1 flex items-center justify-center overflow-hidden h-full">
                  <img
                    src={fileUrl}
                    alt={fileName || "File Preview"}
                    className="max-w-full max-h-full object-contain"
                    style={{ border: 'none', outline: 'none' }}
                  />
                </div>
              ) : isDocx ? (
                <div className="w-full max-w-4xl bg-white neo-border rounded-2xl p-8 my-8 neo-shadow">
                  {docxLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <LoadingSpinner className="w-10 h-10 text-[#C4705A] mx-auto mb-3" />
                        <p className="text-sm font-body text-[#6B6B6B]">Loading DOCX...</p>
                      </div>
                    </div>
                  ) : docxError ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] neo-border flex items-center justify-center mx-auto mb-4">
                          <FileIcon className="w-8 h-8 text-[#B54A4A]" />
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]">Failed to load DOCX</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">{docxError}</p>
                      </div>
                    </div>
                  ) : docxHtml ? (
                    <div
                      className="prose prose-lg max-w-none docx-preview"
                      dangerouslySetInnerHTML={{ __html: docxHtml }}
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.6',
                        color: '#1A1A1A',
                      }}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#EDEAE4] neo-border flex items-center justify-center mx-auto mb-4">
                      <FileIcon className="w-8 h-8 text-[#6B6B6B]" />
                    </div>
                    <p className="font-display font-bold text-[#1A1A1A]">
                      Preview not available for {fileType?.toUpperCase()}
                    </p>
                    <p className="text-sm font-body text-[#6B6B6B] mt-1">
                      The file will still be processed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
