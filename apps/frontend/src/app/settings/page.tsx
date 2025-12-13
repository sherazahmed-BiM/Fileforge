"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { ChunkStrategy } from "@/types";

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

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17,21 17,13 7,13 7,21" />
      <polyline points="7,3 7,8 15,8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 2,7 12,12 22,7 12,2" />
      <polyline points="2,17 12,22 22,17" />
      <polyline points="2,12 12,17 22,12" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

const CHUNK_STRATEGIES: { value: ChunkStrategy; label: string; description: string }[] = [
  { value: "semantic", label: "Semantic", description: "Split by document structure" },
  { value: "fixed", label: "Fixed Size", description: "Split by character count" },
  { value: "none", label: "None", description: "Keep as single block" },
];

interface Settings {
  defaultChunkStrategy: ChunkStrategy;
  defaultChunkSize: number;
  defaultChunkOverlap: number;
  extractTables: boolean;
  ocrEnabled: boolean;
  apiUrl: string;
}

export default function SettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [settings, setSettings] = useState<Settings>({
    defaultChunkStrategy: "semantic",
    defaultChunkSize: 1000,
    defaultChunkOverlap: 100,
    extractTables: true,
    ocrEnabled: true,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:19000",
  });

  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("fileforge-settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSave = () => {
    localStorage.setItem("fileforge-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
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
                Settings
              </h1>
              <p className="font-body text-[#6B6B6B] mt-1">
                Configure default conversion options
              </p>
            </div>
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-5 py-3 font-body font-semibold rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all ${
                saved
                  ? "bg-[#4A6B5A] text-white"
                  : "bg-[#C4705A] text-white"
              }`}
            >
              {saved ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-2xl mx-auto space-y-6">
          {/* Chunking Settings */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#E8F5E9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4A6B5A] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <LayersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Chunking Defaults</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Default settings for document chunking</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Chunk Strategy */}
              <div className="space-y-3">
                <label className="font-display font-semibold text-[#2C2C2C]">Default Chunk Strategy</label>
                <div className="grid grid-cols-3 gap-3">
                  {CHUNK_STRATEGIES.map((strategy) => (
                    <button
                      key={strategy.value}
                      type="button"
                      onClick={() => updateSetting("defaultChunkStrategy", strategy.value)}
                      className={`p-4 rounded-xl border-[2.5px] text-left transition-all ${
                        settings.defaultChunkStrategy === strategy.value
                          ? "border-[#4A6B5A] bg-[#E8F5E9]"
                          : "border-[#E8E4DF] hover:border-[#4A6B5A] bg-white"
                      }`}
                    >
                      <p className={`font-display font-semibold ${
                        settings.defaultChunkStrategy === strategy.value
                          ? "text-[#4A6B5A]"
                          : "text-[#2C2C2C]"
                      }`}>
                        {strategy.label}
                      </p>
                      <p className="font-body text-xs text-[#6B6B6B] mt-1">
                        {strategy.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chunk Size & Overlap */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="chunkSize" className="font-display font-semibold text-[#2C2C2C]">
                    Default Chunk Size
                  </label>
                  <input
                    id="chunkSize"
                    type="number"
                    min={100}
                    max={10000}
                    value={settings.defaultChunkSize}
                    onChange={(e) =>
                      updateSetting("defaultChunkSize", parseInt(e.target.value) || 1000)
                    }
                    className="w-full px-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B5A] focus:ring-offset-2"
                  />
                  <p className="font-body text-xs text-[#6B6B6B]">Characters per chunk (100-10000)</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="chunkOverlap" className="font-display font-semibold text-[#2C2C2C]">
                    Default Chunk Overlap
                  </label>
                  <input
                    id="chunkOverlap"
                    type="number"
                    min={0}
                    max={500}
                    value={settings.defaultChunkOverlap}
                    onChange={(e) =>
                      updateSetting("defaultChunkOverlap", parseInt(e.target.value) || 100)
                    }
                    className="w-full px-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B5A] focus:ring-offset-2"
                  />
                  <p className="font-body text-xs text-[#6B6B6B]">Overlap between chunks (0-500)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Settings */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#F3E5F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9C27B0] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <CpuIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Processing Options</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Default processing settings for uploads</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Extract Tables */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                <div>
                  <p className="font-display font-semibold text-[#2C2C2C]">Extract Tables</p>
                  <p className="font-body text-sm text-[#6B6B6B]">
                    Extract tables with HTML structure
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.extractTables}
                  onChange={(checked) => updateSetting("extractTables", checked)}
                />
              </div>

              {/* OCR Enabled */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                <div>
                  <p className="font-display font-semibold text-[#2C2C2C]">OCR Enabled</p>
                  <p className="font-body text-sm text-[#6B6B6B]">
                    Extract text from images and scanned documents
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.ocrEnabled}
                  onChange={(checked) => updateSetting("ocrEnabled", checked)}
                />
              </div>
            </div>
          </section>

          {/* API Settings */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#E3F2FD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2196F3] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <GlobeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">API Configuration</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Configure the FileForge API connection</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-2">
              <label htmlFor="apiUrl" className="font-display font-semibold text-[#2C2C2C]">
                API URL
              </label>
              <input
                id="apiUrl"
                type="url"
                value={settings.apiUrl}
                onChange={(e) => updateSetting("apiUrl", e.target.value)}
                placeholder="http://localhost:19000"
                className="w-full px-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B5A] focus:ring-offset-2"
              />
              <p className="font-body text-xs text-[#6B6B6B]">
                The base URL of the FileForge API server
              </p>
            </div>
          </section>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full border-[2.5px] border-[#2C2C2C] transition-colors ${
        checked ? "bg-[#4A6B5A]" : "bg-[#E8E4DF]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white border-[2px] border-[#2C2C2C] transition-transform ${
          checked ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}
