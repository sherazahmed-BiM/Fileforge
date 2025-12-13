"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DocumentsList } from "@/components/documents";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import { reprocessDocument } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

// Custom SVG Icons
function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#C4705A" />
      <path
        d="M8 10h16M8 16h12M8 22h14"
        stroke="#FAF8F5"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="22" r="3" fill="#FAF8F5" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/documents", icon: FolderIcon, label: "Documents" },
  { href: "/api-keys", icon: KeyIcon, label: "API Keys" },
  { href: "/api-keys/docs", icon: BookIcon, label: "API Docs" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

export default function DocumentsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data, isLoading } = useDocuments();
  const deleteMutation = useDeleteDocument();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReprocess = async (id: number) => {
    try {
      await reprocessDocument(id);
    } catch (error) {
      console.error("Failed to reprocess document:", error);
    }
  };

  // Filter documents based on search query
  const filteredDocuments = data?.documents?.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#FAF8F5] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#FAF8F5] border-r-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
          {/* Logo */}
          <div className="p-6 border-b-[2.5px] border-[#2C2C2C]">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark className="w-10 h-10" />
              <span className="font-display text-xl font-bold text-[#2C2C2C]">FileForge</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body font-medium transition-all ${
                    isActive
                      ? "bg-[#4A6B5A] text-white border-[2.5px] border-[#2C2C2C] neo-shadow-sm"
                      : "text-[#2C2C2C] hover:bg-[#E8E4DF]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t-[2.5px] border-[#2C2C2C]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4705A] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                <span className="text-white font-display font-bold">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-[#2C2C2C] truncate text-sm">
                  {user?.email || "User"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[#6B6B6B] hover:bg-[#E8E4DF] font-body transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#FAF8F5] border-b-[2.5px] border-[#2C2C2C] px-8 py-6 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-[#2C2C2C]">
                  Documents
                </h1>
                <p className="font-body text-[#6B6B6B] mt-1">
                  View and manage your converted documents
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#C4705A] text-white font-body font-semibold rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Upload New
              </Link>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#2C2C2C] placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#4A6B5A] focus:ring-offset-2"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border-[2px] border-[#4A6B5A] flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-[#4A6B5A]" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-[#2C2C2C]">
                      {data?.documents?.length || 0}
                    </p>
                    <p className="font-body text-sm text-[#6B6B6B]">Total Documents</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] border-[2px] border-[#2196F3] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#2196F3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-[#2C2C2C]">
                      {data?.documents?.filter(d => d.status === "processing").length || 0}
                    </p>
                    <p className="font-body text-sm text-[#6B6B6B]">Processing</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] border-[2px] border-[#FF9800] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#FF9800]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-[#2C2C2C]">
                      {data?.documents?.reduce((acc, d) => acc + (d.total_chunks || 0), 0) || 0}
                    </p>
                    <p className="font-body text-sm text-[#6B6B6B]">Total Chunks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents List */}
            {isLoading ? (
              <div className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[#E8E4DF] border-t-[#4A6B5A] animate-spin" />
                  <p className="font-body text-[#6B6B6B] mt-4">Loading documents...</p>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#FAF8F5] border-[2.5px] border-[#E8E4DF] flex items-center justify-center mb-4">
                    <FileIcon className="w-10 h-10 text-[#6B6B6B]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#2C2C2C]">
                    {searchQuery ? "No documents found" : "No documents yet"}
                  </h3>
                  <p className="font-body text-[#6B6B6B] mt-2 max-w-md">
                    {searchQuery
                      ? `No documents match "${searchQuery}". Try a different search term.`
                      : "Upload your first document to start converting files into LLM-ready data."}
                  </p>
                  {!searchQuery && (
                    <Link
                      href="/dashboard"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#4A6B5A] text-white font-body font-semibold rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Upload Document
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
                <DocumentsList
                  documents={filteredDocuments}
                  isLoading={isLoading}
                  onDelete={handleDelete}
                  onReprocess={handleReprocess}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
