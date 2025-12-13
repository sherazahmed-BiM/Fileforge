"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
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

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16,17 21,12 16,7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sidebar Navigation Items
const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/documents", icon: FolderIcon, label: "Documents" },
  { href: "/api-keys", icon: KeyIcon, label: "API Keys" },
  { href: "/api-keys/docs", icon: BookIcon, label: "API Docs" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

function FileTypesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="8" width="16" height="20" rx="3" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="7" y="22" fill="#FFFFFF" fontSize="7" fontWeight="700">PDF</text>
      <rect x="16" y="14" width="16" height="20" rx="3" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="18" y="28" fill="#FFFFFF" fontSize="6" fontWeight="700">DOC</text>
      <rect x="28" y="10" width="16" height="20" rx="3" fill="#6B9B8A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="30" y="24" fill="#FFFFFF" fontSize="6" fontWeight="700">XLS</text>
    </svg>
  );
}

function ChunkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="4" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="6" y="18" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="6" y="32" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <line x1="12" y1="9" x2="26" y2="9" stroke="#C4705A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="23" x2="30" y2="23" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="37" x2="24" y2="37" stroke="#6B9B8A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function JSONIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="4" width="40" height="40" rx="8" fill="#2C2C2C" stroke="#2C2C2C" strokeWidth="2" />
      <text x="8" y="18" fill="#C4705A" fontSize="8" fontFamily="monospace">{"{"}</text>
      <text x="12" y="28" fill="#6B9B8A" fontSize="7" fontFamily="monospace">"data"</text>
      <text x="12" y="38" fill="#FAF8F5" fontSize="7" fontFamily="monospace">...</text>
      <text x="8" y="44" fill="#C4705A" fontSize="8" fontFamily="monospace">{"}"}</text>
    </svg>
  );
}

function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M8 32C8 20.9 16.9 12 28 12" stroke="#EDEAE4" strokeWidth="6" strokeLinecap="round" />
      <path d="M8 32C8 24.3 12.3 17.6 18.5 14" stroke="#C4705A" strokeWidth="6" strokeLinecap="round" />
      <circle cx="24" cy="32" r="4" fill="#2C2C2C" />
      <path d="M24 32L36 20" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="26" x2="44" y2="26" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="32" x2="46" y2="32" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="38" x2="42" y2="38" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
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

// Supported file types
const ACCEPTED_EXTENSIONS = [
  ".pdf", ".docx", ".xlsx", ".pptx", ".doc", ".xls", ".ppt",
  ".odt", ".ods", ".odp", ".rtf", ".html", ".htm", ".md",
  ".csv", ".tsv", ".json", ".xml", ".png", ".jpg", ".jpeg",
  ".gif", ".bmp", ".tiff", ".tif", ".webp", ".eml", ".msg", ".epub",
];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isValidFile = (file: File): boolean => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(extension);
  };

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      alert("Unsupported file type");
      return;
    }

    // Store file for transform page
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      id: crypto.randomUUID(),
    };
    sessionStorage.setItem("pendingUpload", JSON.stringify(fileData));
    const objectUrl = URL.createObjectURL(file);
    sessionStorage.setItem("pendingUploadUrl", objectUrl);
    (window as typeof window & { __pendingFile?: File }).__pendingFile = file;

    router.push("/transform");
  }, [router]);

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

  const features = [
    { icon: FileTypesIcon, title: "50+ Formats", description: "PDF, DOCX, XLSX, Images, and more" },
    { icon: ChunkIcon, title: "Smart Chunking", description: "Semantic or fixed-size splitting" },
    { icon: JSONIcon, title: "LLM-Ready Output", description: "Clean JSON with metadata" },
    { icon: SpeedIcon, title: "Fast Processing", description: "Sub-3s for most documents" },
  ];

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#FAF8F5] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#FAF8F5] border-r-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-5 border-b-[2.5px] border-[#2C2C2C]">
            <LogoMark className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
              FileForge
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-display font-semibold text-sm transition-all
                    ${isActive
                      ? "bg-[#C4705A] text-white neo-shadow-sm"
                      : "text-[#6B6B6B] hover:bg-[#F5F2ED] hover:text-[#1A1A1A]"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t-[2.5px] border-[#EDEAE4]">
            {user && (
              <div className="mb-3 px-2">
                <p className="text-xs font-display font-semibold text-[#6B6B6B] uppercase tracking-wide">
                  Signed in as
                </p>
                <p className="text-sm font-body text-[#1A1A1A] truncate">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display font-semibold text-sm text-[#6B6B6B] hover:bg-[#F5F2ED] hover:text-[#1A1A1A] transition-all disabled:opacity-50 cursor-pointer"
            >
              <LogoutIcon className="w-5 h-5" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 lg:p-10">
            <div className="max-w-4xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-10">
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] mb-2">
                  Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
                </h1>
                <p className="text-lg font-body text-[#6B6B6B]">
                  Transform any file into LLM-ready structured data
                </p>
              </div>

              {/* Upload Card */}
              <div className="neo-card p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#C4705A] neo-border flex items-center justify-center">
                    <UploadIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-[#1A1A1A]">
                      Upload a File
                    </h2>
                    <p className="text-sm font-body text-[#6B6B6B]">
                      Drop a file to start transforming
                    </p>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                  className={`
                    relative rounded-2xl border-[3px] border-dashed p-10 text-center transition-all cursor-pointer
                    ${isDragging
                      ? "border-[#C4705A] bg-[#C4705A]/5"
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

                  <div className="flex flex-col items-center gap-4">
                    <div className={`
                      w-16 h-16 rounded-2xl neo-border flex items-center justify-center transition-colors
                      ${isDragging ? "bg-[#C4705A]/10" : "bg-[#F5F2ED]"}
                    `}>
                      <UploadIcon className="w-8 h-8 text-[#2C2C2C]" />
                    </div>

                    <div>
                      <p className="text-lg font-display font-semibold text-[#1A1A1A] mb-1">
                        {isDragging ? "Drop your file here" : "Drag & drop your file"}
                      </p>
                      <p className="text-sm font-body text-[#6B6B6B]">
                        or click to browse (max 100MB)
                      </p>
                    </div>

                    <button className="neo-btn bg-[#C4705A] text-white px-6 py-3 text-sm font-display font-semibold cursor-pointer">
                      Select File
                    </button>
                  </div>
                </div>

                {/* Supported Formats */}
                <div className="mt-6 pt-6 border-t-[2px] border-[#EDEAE4]">
                  <p className="text-xs font-display font-semibold text-[#6B6B6B] uppercase tracking-wide mb-3">
                    Supported Formats
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["PDF", "DOCX", "XLSX", "PPTX", "HTML", "CSV", "PNG", "JPG", "EML", "EPUB"].map((format) => (
                      <span
                        key={format}
                        className="px-3 py-1.5 text-xs font-display font-semibold bg-[#F5F2ED] border-[2px] border-[#EDEAE4] rounded-lg text-[#6B6B6B]"
                      >
                        {format}
                      </span>
                    ))}
                    <span className="px-3 py-1.5 text-xs font-display font-semibold bg-[#F5F2ED] border-[2px] border-[#EDEAE4] rounded-lg text-[#6B6B6B]">
                      +40 more
                    </span>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="neo-card-flat p-5 flex items-start gap-4 hover:bg-[#F5F2ED] transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#F5F2ED] neo-border flex items-center justify-center shrink-0">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-[#1A1A1A] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm font-body text-[#6B6B6B]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* API Access Banner */}
              <div className="neo-card p-6 bg-[#2C2C2C] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#C4705A] flex items-center justify-center">
                    <KeyIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-[#FAF8F5]">
                      API Access
                    </h3>
                    <p className="text-sm font-body text-[#A0A0A0]">
                      Integrate FileForge into your applications
                    </p>
                  </div>
                </div>
                <Link href="/api-keys">
                  <button className="px-6 py-3 rounded-xl bg-[#C4705A] border-[2.5px] border-[#C4705A] text-white font-display font-semibold text-sm hover:bg-[#B5614B] transition-colors cursor-pointer flex items-center gap-2">
                    Get API Key
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
