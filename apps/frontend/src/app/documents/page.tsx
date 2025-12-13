"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentsList } from "@/components/documents";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import { reprocessDocument } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

export default function DocumentsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data, isLoading } = useDocuments();
  const deleteMutation = useDeleteDocument();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
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

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col relative">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b-3 border-[#0f172a] bg-white">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="h-10 w-10 rounded-xl neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center justify-center transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E91E8C] neo-border-2 neo-shadow-sm flex items-center justify-center">
                <FileIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl">FileForge</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            {user && (
              <span className="text-sm font-body text-[#6B6B6B]">
                {user.email}
              </span>
            )}
            <Link
              href="/upload"
              className="neo-btn px-5 py-2.5 bg-[#E91E8C] text-white font-bold rounded-xl flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Upload New
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-10 px-4 rounded-xl neo-border-2 bg-white hover:bg-[#f1f5f9] flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogoutIcon className="h-4 w-4 text-[#2C2C2C]" />
              <span className="text-sm font-bold text-[#2C2C2C]">
                {isLoggingOut ? "..." : "Logout"}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-[#0f172a]">Documents</h1>
            <p className="text-[#64748b] font-medium mt-2">
              View and manage your converted documents
            </p>
          </div>

          <DocumentsList
            documents={data?.documents || []}
            isLoading={isLoading}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
          />
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
