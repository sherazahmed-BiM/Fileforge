"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import {
  useAPIKeys,
  useCreateAPIKey,
  useDeleteAPIKey,
  useUpdateAPIKey,
} from "@/hooks/use-api-keys";
import type { APIKey, CreateAPIKeyRequest } from "@/types";

// Custom SVG Icons
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="3,6 5,6 21,6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
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

// Sidebar Navigation Items
const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/documents", icon: FolderIcon, label: "Documents" },
  { href: "/api-keys", icon: KeyIcon, label: "API Keys" },
  { href: "/api-keys/docs", icon: BookIcon, label: "API Docs" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

export default function APIKeysPage() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<APIKey | null>(null);
  const [createForm, setCreateForm] = useState<CreateAPIKeyRequest>({
    name: "",
    rate_limit_rpm: 60,
    rate_limit_rpd: 1000,
    expires_in_days: undefined,
  });

  const { data, isLoading, error } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const deleteMutation = useDeleteAPIKey();
  const updateMutation = useUpdateAPIKey();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync(createForm);
      setNewKeyData({ key: result.key, name: result.name });
      setIsCreateModalOpen(false);
      setIsKeyModalOpen(true);
      setCreateForm({
        name: "",
        rate_limit_rpm: 60,
        rate_limit_rpd: 1000,
        expires_in_days: undefined,
      });
    } catch (err) {
      console.error("Failed to create API key:", err);
    }
  };

  const handleDelete = async () => {
    if (!keyToDelete) return;
    try {
      await deleteMutation.mutateAsync(keyToDelete.id);
      setIsDeleteModalOpen(false);
      setKeyToDelete(null);
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  const handleToggleActive = async (apiKey: APIKey) => {
    try {
      await updateMutation.mutateAsync({
        id: apiKey.id,
        request: { is_active: !apiKey.is_active },
      });
    } catch (err) {
      console.error("Failed to toggle API key:", err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#FAF8F5] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#FAF8F5] border-r-[2.5px] border-[#2C2C2C] flex flex-col shrink-0">
          <div className="h-16 flex items-center gap-3 px-5 border-b-[2.5px] border-[#2C2C2C]">
            <LogoMark className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
              FileForge
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && item.href !== "/api-keys" && pathname.startsWith(item.href)) ||
                (item.href === "/api-keys" && pathname === "/api-keys");
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
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
                    API Keys
                  </h1>
                  <p className="text-base font-body text-[#6B6B6B]">
                    Manage your API keys for external integrations
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/api-keys/docs">
                    <button className="h-11 px-5 rounded-xl neo-border bg-white hover:bg-[#F5F2ED] flex items-center gap-2 transition-colors neo-shadow-sm cursor-pointer">
                      <BookIcon className="w-4 h-4 text-[#2C2C2C]" />
                      <span className="text-sm font-display font-semibold text-[#2C2C2C]">
                        View Docs
                      </span>
                    </button>
                  </Link>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="neo-btn bg-[#C4705A] text-white h-11 px-5 text-sm font-display font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create API Key
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="neo-card-flat p-5 mb-6 bg-[#4A6B5A]/10 border-[#4A6B5A]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#4A6B5A] flex items-center justify-center shrink-0">
                    <KeyIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-[#1A1A1A] mb-1">
                      Public API Access
                    </p>
                    <p className="text-sm font-body text-[#6B6B6B]">
                      Use API keys to access FileForge from external applications.
                      Include the key in the <code className="px-1.5 py-0.5 rounded bg-[#F5F2ED] border border-[#EDEAE4] text-[#C4705A] font-mono text-xs">X-API-Key</code> header.
                    </p>
                  </div>
                </div>
              </div>

              {/* API Keys Table */}
              <div className="neo-card overflow-hidden mb-6">
                <div className="px-6 py-4 border-b-[2.5px] border-[#EDEAE4]">
                  <h2 className="text-lg font-display font-bold text-[#1A1A1A]">
                    Your API Keys
                  </h2>
                  <p className="text-sm font-body text-[#6B6B6B]">
                    {data?.total || 0} API key{data?.total !== 1 ? "s" : ""} created
                  </p>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner className="w-8 h-8 text-[#C4705A]" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-[#B54A4A]">
                      <AlertIcon className="w-5 h-5" />
                      <span className="font-body">Failed to load API keys</span>
                    </div>
                  ) : data?.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] neo-border flex items-center justify-center mb-4">
                        <KeyIcon className="w-8 h-8 text-[#6B6B6B]" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-[#1A1A1A] mb-2">
                        No API keys yet
                      </h3>
                      <p className="text-sm font-body text-[#6B6B6B] mb-6 max-w-sm">
                        Create your first API key to start using the FileForge API
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="neo-btn bg-[#C4705A] text-white px-6 py-3 text-sm font-display font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Create API Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data?.items.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="p-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl neo-border flex items-center justify-center ${apiKey.is_active ? "bg-[#4A6B5A]" : "bg-[#6B6B6B]"}`}>
                                <KeyIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <p className="font-display font-semibold text-[#1A1A1A]">
                                    {apiKey.name}
                                  </p>
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-display font-semibold ${
                                    apiKey.is_active
                                      ? "bg-[#4A6B5A]/10 text-[#4A6B5A]"
                                      : "bg-[#6B6B6B]/10 text-[#6B6B6B]"
                                  }`}>
                                    {apiKey.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                  <code className="text-sm font-mono text-[#6B6B6B]">
                                    {apiKey.key_prefix}...
                                  </code>
                                  <span className="text-xs font-body text-[#6B6B6B]">
                                    {apiKey.total_requests.toLocaleString()} requests
                                  </span>
                                  <span className="text-xs font-body text-[#6B6B6B]">
                                    Last used: {formatDate(apiKey.last_used_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleActive(apiKey)}
                                className="h-9 px-3 rounded-lg border-[2px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                {apiKey.is_active ? (
                                  <EyeOffIcon className="w-4 h-4 text-[#6B6B6B]" />
                                ) : (
                                  <EyeIcon className="w-4 h-4 text-[#6B6B6B]" />
                                )}
                                <span className="text-xs font-display font-semibold text-[#2C2C2C]">
                                  {apiKey.is_active ? "Deactivate" : "Activate"}
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setKeyToDelete(apiKey);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-9 w-9 rounded-lg border-[2px] border-[#B54A4A] bg-white hover:bg-[#B54A4A]/10 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <TrashIcon className="w-4 h-4 text-[#B54A4A]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rate Limits */}
              <div className="neo-card-flat p-6">
                <h3 className="text-lg font-display font-bold text-[#1A1A1A] mb-4">
                  Rate Limits
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white">
                    <p className="text-3xl font-display font-bold text-[#C4705A]">60</p>
                    <p className="text-sm font-body text-[#6B6B6B]">Requests per minute</p>
                  </div>
                  <div className="p-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white">
                    <p className="text-3xl font-display font-bold text-[#4A6B5A]">1,000</p>
                    <p className="text-sm font-body text-[#6B6B6B]">Requests per day</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1A1A1A]/50" onClick={() => setIsCreateModalOpen(false)} />
            <div className="relative neo-card p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-[#1A1A1A]">
                  Create API Key
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F2ED] flex items-center justify-center cursor-pointer"
                >
                  <CloseIcon className="w-5 h-5 text-[#6B6B6B]" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Production, Development"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C4705A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                      Requests/min
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={createForm.rate_limit_rpm}
                      onChange={(e) => setCreateForm({ ...createForm, rate_limit_rpm: parseInt(e.target.value) || 60 })}
                      className="w-full h-11 px-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] focus:outline-none focus:border-[#C4705A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                      Requests/day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={createForm.rate_limit_rpd}
                      onChange={(e) => setCreateForm({ ...createForm, rate_limit_rpd: parseInt(e.target.value) || 1000 })}
                      className="w-full h-11 px-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] focus:outline-none focus:border-[#C4705A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                    Expires in (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Leave empty for no expiration"
                    value={createForm.expires_in_days || ""}
                    onChange={(e) => setCreateForm({ ...createForm, expires_in_days: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full h-11 px-4 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C4705A]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] font-display font-semibold text-sm text-[#2C2C2C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex-1 neo-btn bg-[#C4705A] text-white h-11 text-sm font-display font-semibold cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show Key Modal */}
        {isKeyModalOpen && newKeyData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1A1A1A]/50" onClick={() => setIsKeyModalOpen(false)} />
            <div className="relative neo-card p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-[#1A1A1A]">
                  API Key Created
                </h2>
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F2ED] flex items-center justify-center cursor-pointer"
                >
                  <CloseIcon className="w-5 h-5 text-[#6B6B6B]" />
                </button>
              </div>

              <div className="p-4 rounded-xl border-[2.5px] border-[#C4705A] bg-[#C4705A]/5 mb-6">
                <div className="flex items-start gap-3">
                  <AlertIcon className="w-5 h-5 text-[#C4705A] mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-[#1A1A1A] mb-1">Important</p>
                    <p className="text-sm font-body text-[#6B6B6B]">
                      This is the only time your full API key will be displayed. Store it securely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                  API Key
                </label>
                <CopyableKey apiKey={newKeyData.key} />
              </div>

              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="w-full neo-btn bg-[#4A6B5A] text-white h-11 text-sm font-display font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && keyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1A1A1A]/50" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative neo-card p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-[#1A1A1A]">
                  Delete API Key
                </h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F2ED] flex items-center justify-center cursor-pointer"
                >
                  <CloseIcon className="w-5 h-5 text-[#6B6B6B]" />
                </button>
              </div>

              <p className="text-sm font-body text-[#6B6B6B] mb-6">
                Are you sure you want to delete "<span className="font-semibold text-[#1A1A1A]">{keyToDelete.name}</span>"?
                This action cannot be undone. Any applications using this key will immediately lose access.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] font-display font-semibold text-sm text-[#2C2C2C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-11 rounded-xl border-[2.5px] border-[#B54A4A] bg-[#B54A4A] hover:bg-[#A43A3A] text-white font-display font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

// Copyable key component
function CopyableKey({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 p-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-[#F5F2ED] text-sm font-mono text-[#1A1A1A] break-all">
        {visible ? apiKey : "•".repeat(Math.min(apiKey.length, 40))}
      </code>
      <button
        onClick={() => setVisible(!visible)}
        className="w-11 h-11 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] flex items-center justify-center cursor-pointer"
      >
        {visible ? (
          <EyeOffIcon className="w-5 h-5 text-[#6B6B6B]" />
        ) : (
          <EyeIcon className="w-5 h-5 text-[#6B6B6B]" />
        )}
      </button>
      <button
        onClick={handleCopy}
        className="w-11 h-11 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white hover:bg-[#F5F2ED] flex items-center justify-center cursor-pointer"
      >
        {copied ? (
          <CheckIcon className="w-5 h-5 text-[#4A6B5A]" />
        ) : (
          <CopyIcon className="w-5 h-5 text-[#6B6B6B]" />
        )}
      </button>
    </div>
  );
}
