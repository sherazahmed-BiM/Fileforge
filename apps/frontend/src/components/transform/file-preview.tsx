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

// Dynamically import libraries for document conversion (only on client)
let mammoth: typeof import("mammoth") | null = null;
let XLSX: typeof import("xlsx") | null = null;
let Papa: typeof import("papaparse") | null = null;
let JSZip: typeof import("jszip") | null = null;

if (typeof window !== "undefined") {
  import("mammoth").then((mod) => {
    mammoth = mod;
  });
  import("xlsx").then((mod) => {
    XLSX = mod;
  });
  import("papaparse").then((mod) => {
    Papa = mod;
  });
  import("jszip").then((mod) => {
    JSZip = mod.default;
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
  
  // XLSX preview state
  const [xlsxData, setXlsxData] = useState<{ sheets: Array<{ name: string; data: any[][] }> } | null>(null);
  const [xlsxLoading, setXlsxLoading] = useState<boolean>(false);
  const [xlsxError, setXlsxError] = useState<string | null>(null);
  const [xlsxActiveSheet, setXlsxActiveSheet] = useState<number>(0);
  
  // CSV preview state
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  
  // PPTX preview state
  const [pptxData, setPptxData] = useState<Array<{ slideNumber: number; content: string; images?: string[] }> | null>(null);
  const [pptxLoading, setPptxLoading] = useState<boolean>(false);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [pptxActiveSlide, setPptxActiveSlide] = useState<number>(0);

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

  // Convert XLSX when file changes
  useEffect(() => {
    const isXlsx = fileType?.toLowerCase() === "xlsx";
    
    if (!isXlsx || !fileUrl) {
      setXlsxData(null);
      setXlsxError(null);
      return;
    }

    const convertXlsx = async () => {
      if (!XLSX) {
        const mod = await import("xlsx");
        XLSX = mod;
      }

      setXlsxLoading(true);
      setXlsxError(null);
      setXlsxData(null);

      try {
        if (!XLSX) {
          const mod = await import("xlsx");
          XLSX = mod;
        }

        if (!XLSX) {
          throw new Error("Failed to load XLSX library");
        }

        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheets = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const data = XLSX!.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
          return { name, data };
        });

        setXlsxData({ sheets });
        setXlsxActiveSheet(0);
      } catch (error) {
        console.error("Failed to convert XLSX:", error);
        setXlsxError(error instanceof Error ? error.message : "Failed to load XLSX");
      } finally {
        setXlsxLoading(false);
      }
    };

    convertXlsx();
  }, [fileUrl, fileType]);

  // Convert CSV when file changes
  useEffect(() => {
    const isCsv = fileType?.toLowerCase() === "csv";
    
    if (!isCsv || !fileUrl) {
      setCsvData(null);
      setCsvError(null);
      return;
    }

    const convertCsv = async () => {
      if (!Papa) {
        const mod = await import("papaparse");
        Papa = mod;
      }

      setCsvLoading(true);
      setCsvError(null);
      setCsvData(null);

      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          transform: (value: string) => {
            // Trim whitespace and handle empty values
            return value ? value.trim() : "";
          },
          complete: (results: any) => {
            console.log("CSV parse results:", results);
            if (results.data && Array.isArray(results.data) && results.data.length > 0) {
              const rows = results.data as string[][];
              // Filter out completely empty rows
              const nonEmptyRows = rows.filter(row => 
                Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== "")
              );
              
              console.log("Non-empty rows:", nonEmptyRows);
              
              if (nonEmptyRows.length > 0) {
                // Use first row as headers, rest as data
                const firstRow = nonEmptyRows[0] || [];
                const headers = firstRow.map((cell: any) => String(cell || "").trim());
                const dataRows = nonEmptyRows.slice(1).map(row => 
                  row.map((cell: any) => String(cell || "").trim())
                );
                
                console.log("CSV headers:", headers);
                console.log("CSV data rows:", dataRows);
                
                setCsvData({ headers, rows: dataRows });
              } else {
                console.warn("No non-empty rows found in CSV");
                setCsvData({ headers: [], rows: [] });
              }
            } else {
              console.warn("No data found in CSV parse results");
              setCsvData({ headers: [], rows: [] });
            }
            setCsvLoading(false);
          },
          error: (error: any) => {
            console.error("Failed to parse CSV:", error);
            setCsvError(error.message || "Failed to parse CSV");
            setCsvLoading(false);
          },
        });
      } catch (error) {
        console.error("Failed to load CSV:", error);
        setCsvError(error instanceof Error ? error.message : "Failed to load CSV");
        setCsvLoading(false);
      }
    };

    convertCsv();
  }, [fileUrl, fileType]);

  // Convert PPTX when file changes
  useEffect(() => {
    const isPptx = fileType?.toLowerCase() === "pptx";
    
    if (!isPptx || !fileUrl) {
      setPptxData(null);
      setPptxError(null);
      return;
    }

    const convertPptx = async () => {
      setPptxLoading(true);
      setPptxError(null);
      setPptxData(null);

      try {
        if (!JSZip) {
          const mod = await import("jszip");
          JSZip = mod.default;
        }

        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // PPTX files are ZIP archives containing XML files
        // Extract text from the XML structure for preview
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        const slides: Array<{ slideNumber: number; content: string; images?: string[] }> = [];
        let slideIndex = 1;
        
        // Parse slide XML files
        const slideFiles = Object.keys(zip.files).filter(name => 
          name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
        ).sort();
        
        for (const filename of slideFiles) {
          try {
            const file = zip.files[filename];
            if (!file) continue;
            
            const xmlContent = await file.async("string");
            // Extract text from XML (simple regex-based extraction for a:t elements)
            const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
            const texts = textMatches.map(match => {
              const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
              return textMatch ? textMatch[1] : "";
            }).filter(t => t.trim());
            
            if (texts.length > 0) {
              slides.push({
                slideNumber: slideIndex,
                content: `<div class="space-y-4"><h2 class="text-2xl font-display font-bold mb-4 text-[#1A1A1A]">Slide ${slideIndex}</h2><div class="space-y-2">${texts.map(t => `<p class="text-base font-body text-[#1A1A1A]">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join("")}</div></div>`,
              });
              slideIndex++;
            }
          } catch (e) {
            console.warn(`Failed to parse slide ${filename}:`, e);
          }
        }
        
        if (slides.length > 0) {
          setPptxData(slides);
          setPptxActiveSlide(0);
        } else {
          setPptxError("No extractable text content found in PPTX. The file will still be processed.");
        }
      } catch (error) {
        console.error("Failed to convert PPTX:", error);
        setPptxError(error instanceof Error ? error.message : "Failed to load PPTX. The file will still be processed.");
      } finally {
        setPptxLoading(false);
      }
    };

    convertPptx();
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
  const isXlsx = fileType?.toLowerCase() === "xlsx";
  const isCsv = fileType?.toLowerCase() === "csv";
  const isPptx = fileType?.toLowerCase() === "pptx";

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
              ) : isXlsx ? (
                <div className="w-full max-w-6xl bg-white neo-border rounded-2xl p-6 my-8 neo-shadow">
                  {xlsxLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <LoadingSpinner className="w-10 h-10 text-[#C4705A] mx-auto mb-3" />
                        <p className="text-sm font-body text-[#6B6B6B]">Loading XLSX...</p>
                      </div>
                    </div>
                  ) : xlsxError ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] neo-border flex items-center justify-center mx-auto mb-4">
                          <FileIcon className="w-8 h-8 text-[#B54A4A]" />
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]">Failed to load XLSX</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">{xlsxError}</p>
                      </div>
                    </div>
                  ) : xlsxData && xlsxData.sheets.length > 0 ? (
                    <div>
                      {/* Sheet selector */}
                      {xlsxData.sheets.length > 1 && (
                        <div className="mb-4 flex gap-2 flex-wrap">
                          {xlsxData.sheets.map((sheet, index) => (
                            <button
                              key={index}
                              onClick={() => setXlsxActiveSheet(index)}
                              className={`px-4 py-2 rounded-lg neo-border text-sm font-display font-semibold transition-colors ${
                                xlsxActiveSheet === index
                                  ? "bg-[#C4705A] text-white"
                                  : "bg-white text-[#1A1A1A] hover:bg-[#F5F2ED]"
                              }`}
                            >
                              {sheet.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse neo-border">
                          {xlsxData.sheets[xlsxActiveSheet].data.length > 0 && (
                            <>
                              <thead>
                                <tr>
                                  {xlsxData.sheets[xlsxActiveSheet].data[0].map((cell, cellIndex) => {
                                    const cellValue = cell !== null && cell !== undefined ? String(cell) : "";
                                    return (
                                      <th
                                        key={cellIndex}
                                        className="neo-border p-3 text-sm bg-[#F5F2ED] font-display font-bold text-left text-[#1A1A1A]"
                                      >
                                        {cellValue}
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {xlsxData.sheets[xlsxActiveSheet].data.slice(1).map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => {
                                      const cellValue = cell !== null && cell !== undefined ? String(cell) : "";
                                      return (
                                        <td
                                          key={cellIndex}
                                          className="neo-border p-3 text-sm bg-white font-body text-[#1A1A1A]"
                                        >
                                          {cellValue}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </>
                          )}
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : isCsv ? (
                <div className="w-full max-w-6xl bg-white neo-border rounded-2xl p-6 my-8 neo-shadow">
                  {csvLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <LoadingSpinner className="w-10 h-10 text-[#C4705A] mx-auto mb-3" />
                        <p className="text-sm font-body text-[#6B6B6B]">Loading CSV...</p>
                      </div>
                    </div>
                  ) : csvError ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] neo-border flex items-center justify-center mx-auto mb-4">
                          <FileIcon className="w-8 h-8 text-[#B54A4A]" />
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]">Failed to load CSV</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">{csvError}</p>
                      </div>
                    </div>
                  ) : csvData ? (
                    <div className="overflow-x-auto">
                      {csvData.headers.length === 0 && csvData.rows.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm font-body text-[#6B6B6B]">No data found in CSV file</p>
                        </div>
                      ) : (
                        <table className="w-full border-collapse neo-border">
                          {csvData.headers.length > 0 && (
                            <thead>
                              <tr>
                                {csvData.headers.map((header, index) => (
                                  <th
                                    key={index}
                                    className="neo-border p-3 text-sm bg-[#F5F2ED] font-display font-bold text-left"
                                  >
                                    {header || `Column ${index + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {csvData.rows.length > 0 ? (
                              csvData.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="neo-border p-3 text-sm bg-white font-body"
                                    >
                                      {cell || ""}
                                    </td>
                                  ))}
                                  {/* Fill empty cells if row is shorter than headers */}
                                  {csvData.headers.length > row.length &&
                                    Array.from({ length: csvData.headers.length - row.length }).map((_, index) => (
                                      <td
                                        key={`empty-${index}`}
                                        className="neo-border p-3 text-sm bg-white font-body"
                                      >
                                        {""}
                                      </td>
                                    ))}
                                </tr>
                              ))
                            ) : csvData.headers.length > 0 ? (
                              <tr>
                                <td
                                  colSpan={csvData.headers.length}
                                  className="neo-border p-3 text-sm bg-white font-body text-center text-[#6B6B6B]"
                                >
                                  No data rows found
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : isPptx ? (
                <div className="w-full max-w-4xl bg-white neo-border rounded-2xl p-8 my-8 neo-shadow">
                  {pptxLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <LoadingSpinner className="w-10 h-10 text-[#C4705A] mx-auto mb-3" />
                        <p className="text-sm font-body text-[#6B6B6B]">Loading PPTX...</p>
                      </div>
                    </div>
                  ) : pptxError ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] neo-border flex items-center justify-center mx-auto mb-4">
                          <FileIcon className="w-8 h-8 text-[#B54A4A]" />
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]">PPTX Preview</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">{pptxError}</p>
                        <p className="text-xs font-body text-[#6B6B6B] mt-2">
                          The file will still be processed and extracted text will be available
                        </p>
                      </div>
                    </div>
                  ) : pptxData && pptxData.length > 0 ? (
                    <div>
                      {/* Slide navigation */}
                      {pptxData.length > 1 && (
                        <div className="mb-4 flex items-center justify-between">
                          <button
                            onClick={() => setPptxActiveSlide(Math.max(0, pptxActiveSlide - 1))}
                            disabled={pptxActiveSlide === 0}
                            className={`px-4 py-2 rounded-lg neo-border text-sm font-display font-semibold ${
                              pptxActiveSlide === 0
                                ? "bg-[#EDEAE4] text-[#A0A0A0] cursor-not-allowed"
                                : "bg-white text-[#1A1A1A] hover:bg-[#F5F2ED]"
                            }`}
                          >
                            Previous
                          </button>
                          <span className="text-sm font-body text-[#6B6B6B]">
                            Slide {pptxActiveSlide + 1} of {pptxData.length}
                          </span>
                          <button
                            onClick={() => setPptxActiveSlide(Math.min(pptxData.length - 1, pptxActiveSlide + 1))}
                            disabled={pptxActiveSlide === pptxData.length - 1}
                            className={`px-4 py-2 rounded-lg neo-border text-sm font-display font-semibold ${
                              pptxActiveSlide === pptxData.length - 1
                                ? "bg-[#EDEAE4] text-[#A0A0A0] cursor-not-allowed"
                                : "bg-white text-[#1A1A1A] hover:bg-[#F5F2ED]"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                      {/* Slide content */}
                      <div className="min-h-[400px] p-6 bg-[#FAF8F5] rounded-lg neo-border">
                        <div className="prose max-w-none">
                          {pptxData[pptxActiveSlide]?.content && (
                            <div dangerouslySetInnerHTML={{ __html: pptxData[pptxActiveSlide].content }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <p className="font-display font-bold text-[#1A1A1A]">PPTX Preview</p>
                        <p className="text-sm font-body text-[#6B6B6B] mt-1">
                          Preview is being processed. The file will still be extracted.
                        </p>
                      </div>
                    </div>
                  )}
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
