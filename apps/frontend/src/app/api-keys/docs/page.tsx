"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,18 22,12 16,6" />
      <polyline points="8,6 2,12 8,18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
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

export default function APIDocsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"python" | "javascript" | "curl" | "go">("python");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
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
                API Documentation
              </h1>
              <p className="font-body text-[#6B6B6B] mt-1">
                Complete guide to using the FileForge Public API
              </p>
            </div>
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#C4705A] text-white font-body font-semibold rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <KeyIcon className="w-5 h-5" />
              Manage API Keys
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-4xl mx-auto space-y-8">
          {/* Quick Start */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#FFF9E6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD93D] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <ZapIcon className="w-5 h-5 text-[#2C2C2C]" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Quick Start</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Get started with the FileForge API in minutes</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { step: 1, title: "Create API Key", desc: "Go to API Keys and create a new key", link: "/api-keys" },
                  { step: 2, title: "Add Header", desc: "Include X-API-Key in requests", code: "X-API-Key" },
                  { step: 3, title: "Convert Files", desc: "Upload files to get LLM-ready output", icon: true },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                    <div className="w-10 h-10 rounded-full bg-[#4A6B5A] border-[2.5px] border-[#2C2C2C] flex items-center justify-center shrink-0">
                      <span className="text-white font-display font-bold">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-[#2C2C2C]">{item.title}</p>
                      <p className="font-body text-sm text-[#6B6B6B] mt-1">
                        {item.link ? (
                          <>
                            Go to{" "}
                            <Link href={item.link} className="text-[#C4705A] underline underline-offset-2">
                              API Keys
                            </Link>{" "}
                            and create a new key
                          </>
                        ) : item.code ? (
                          <>
                            Include <code className="px-1.5 py-0.5 bg-[#2C2C2C] text-white rounded text-xs">{item.code}</code> in requests
                          </>
                        ) : (
                          item.desc
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#E8F5E9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4A6B5A] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <ShieldIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Authentication</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">How to authenticate your API requests</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="font-body text-[#6B6B6B]">
                All API requests must include your API key in the{" "}
                <code className="px-1.5 py-0.5 bg-[#2C2C2C] text-white rounded text-sm">X-API-Key</code> header.
                API keys start with <code className="px-1.5 py-0.5 bg-[#2C2C2C] text-white rounded text-sm">ff_live_</code>.
              </p>
              <CodeBlock
                title="Example Request Header"
                code={`X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
              />
              <div className="p-4 rounded-xl bg-[#FFF3E0] border-[2px] border-[#FFB74D]">
                <div className="flex gap-3">
                  <AlertIcon className="w-5 h-5 text-[#F57C00] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-[#E65100]">Keep your API key secure</p>
                    <p className="font-body text-sm text-[#E65100] mt-1">
                      Never expose your API key in client-side code or public repositories.
                      Use environment variables to store keys securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Base URL */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C]">
              <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Base URL</h2>
            </div>
            <div className="p-6">
              <CodeBlock code={`https://your-domain.com/api/v1/public`} />
              <p className="font-body text-sm text-[#6B6B6B] mt-3">
                For local development:{" "}
                <code className="px-1.5 py-0.5 bg-[#2C2C2C] text-white rounded text-xs">
                  http://localhost:19000/api/v1/public
                </code>
              </p>
            </div>
          </section>

          {/* API Endpoints */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#E3F2FD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2196F3] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <CodeIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#2C2C2C]">API Endpoints</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Convert Endpoint */}
              <EndpointSection
                method="POST"
                path="/convert"
                description="Convert a file to LLM-ready format (synchronous)"
                requestBody={`# Form Data
file: <binary>           # Required - The file to convert
chunk_strategy: semantic # Optional - semantic, fixed, or none
chunk_size: 1000         # Optional - Characters per chunk (100-10000)
chunk_overlap: 100       # Optional - Overlap between chunks (0-500)`}
                responseExample={`{
  "success": true,
  "document": {
    "filename": "report.pdf",
    "file_type": "pdf",
    "file_size_bytes": 102400,
    "page_count": 10
  },
  "content": {
    "pages": [
      {
        "page_number": 1,
        "text": "Introduction to Machine Learning...",
        "word_count": 250
      }
    ],
    "chunks": [
      {
        "index": 0,
        "text": "Introduction to Machine Learning...",
        "token_count": 150,
        "source_page": 1
      }
    ]
  },
  "statistics": {
    "total_pages": 10,
    "total_words": 5000,
    "total_chunks": 25,
    "total_tokens": 4500,
    "processing_time_ms": 1234
  }
}`}
              />

              {/* Usage Endpoint */}
              <EndpointSection
                method="GET"
                path="/usage"
                description="Get current usage statistics for your API key"
                responseExample={`{
  "success": true,
  "api_key_name": "Production",
  "rate_limit_rpm": 60,
  "rate_limit_rpd": 1000,
  "requests_this_minute": 5,
  "requests_today": 142,
  "total_requests": 1523,
  "last_used_at": "2025-01-15T10:30:00Z"
}`}
              />

              {/* Formats Endpoint */}
              <EndpointSection
                method="GET"
                path="/formats"
                description="List all supported file formats"
                responseExample={`{
  "success": true,
  "formats": [
    {
      "extension": ".pdf",
      "mime_type": "application/pdf",
      "category": "Documents",
      "description": "PDF documents"
    },
    {
      "extension": ".docx",
      "mime_type": "application/vnd.openxmlformats...",
      "category": "Documents",
      "description": "Microsoft Word documents"
    }
  ],
  "total": 50
}`}
              />
            </div>
          </section>

          {/* Code Examples */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#F3E5F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9C27B0] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Code Examples</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Ready-to-use examples in popular languages</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Custom Tabs */}
              <div className="flex gap-2 mb-4 p-1 bg-[#FAF8F5] rounded-xl border-[2px] border-[#E8E4DF]">
                {(["python", "javascript", "curl", "go"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-body font-medium text-sm transition-all ${
                      activeTab === tab
                        ? "bg-[#2C2C2C] text-white"
                        : "text-[#6B6B6B] hover:text-[#2C2C2C]"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "python" && (
                <CodeBlock
                  title="Python (requests)"
                  code={`import requests

API_KEY = "ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
API_URL = "http://localhost:19000/api/v1/public/convert"

# Upload and convert a file
with open("document.pdf", "rb") as f:
    response = requests.post(
        API_URL,
        headers={"X-API-Key": API_KEY},
        files={"file": ("document.pdf", f, "application/pdf")},
        data={
            "chunk_strategy": "semantic",
            "chunk_size": 1000,
            "chunk_overlap": 100
        }
    )

if response.status_code == 200:
    result = response.json()
    print(f"Extracted {result['statistics']['total_chunks']} chunks")
    print(f"Total tokens: {result['statistics']['total_tokens']}")

    # Access chunks
    for chunk in result['content']['chunks']:
        print(f"Chunk {chunk['index']}: {chunk['text'][:100]}...")
else:
    print(f"Error: {response.json()}")`}
                />
              )}

              {activeTab === "javascript" && (
                <CodeBlock
                  title="JavaScript (Node.js)"
                  code={`const fs = require('fs');
const FormData = require('form-data');

const API_KEY = 'ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const API_URL = 'http://localhost:19000/api/v1/public/convert';

async function convertFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('chunk_strategy', 'semantic');
  form.append('chunk_size', '1000');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }

  const result = await response.json();
  console.log(\`Extracted \${result.statistics.total_chunks} chunks\`);
  return result;
}

// Usage
convertFile('document.pdf')
  .then(result => console.log(result))
  .catch(err => console.error(err));`}
                />
              )}

              {activeTab === "curl" && (
                <CodeBlock
                  title="cURL"
                  code={`# Convert a file
curl -X POST "http://localhost:19000/api/v1/public/convert" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -F "file=@document.pdf" \\
  -F "chunk_strategy=semantic" \\
  -F "chunk_size=1000"

# Check usage
curl "http://localhost:19000/api/v1/public/usage" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# List supported formats
curl "http://localhost:19000/api/v1/public/formats" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`}
                />
              )}

              {activeTab === "go" && (
                <CodeBlock
                  title="Go"
                  code={`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
)

const (
    apiKey = "ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    apiURL = "http://localhost:19000/api/v1/public/convert"
)

func convertFile(filePath string) (map[string]interface{}, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)

    part, _ := writer.CreateFormFile("file", filepath.Base(filePath))
    io.Copy(part, file)
    writer.WriteField("chunk_strategy", "semantic")
    writer.Close()

    req, _ := http.NewRequest("POST", apiURL, body)
    req.Header.Set("X-API-Key", apiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func main() {
    result, err := convertFile("document.pdf")
    if err != nil {
        panic(err)
    }
    fmt.Printf("Result: %+v\\n", result)
}`}
                />
              )}
            </div>
          </section>

          {/* Rate Limits */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#FFF3E0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF9800] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Rate Limits</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Understanding API rate limiting</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-6 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                  <p className="font-display text-4xl font-bold text-[#4A6B5A]">60</p>
                  <p className="font-body text-[#6B6B6B] mt-1">Requests per minute (RPM)</p>
                </div>
                <div className="p-6 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                  <p className="font-display text-4xl font-bold text-[#4A6B5A]">1,000</p>
                  <p className="font-body text-[#6B6B6B] mt-1">Requests per day (RPD)</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-display font-semibold text-[#2C2C2C]">Rate Limit Headers</p>
                <p className="font-body text-sm text-[#6B6B6B]">
                  Every response includes headers to help you track your usage:
                </p>
                <CodeBlock
                  code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699999999
X-RateLimit-Limit-Day: 1000
X-RateLimit-Remaining-Day: 858`}
                />
              </div>

              <div className="space-y-3">
                <p className="font-display font-semibold text-[#2C2C2C]">Rate Limit Exceeded Response</p>
                <CodeBlock
                  code={`{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}`}
                />
              </div>
            </div>
          </section>

          {/* Error Codes */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#FFEBEE]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F44336] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <AlertIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Error Codes</h2>
                  <p className="font-body text-sm text-[#6B6B6B]">Common errors and how to handle them</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-[2px] border-[#E8E4DF]">
                      <th className="py-3 text-left font-display font-semibold text-[#2C2C2C]">Status</th>
                      <th className="py-3 text-left font-display font-semibold text-[#2C2C2C]">Code</th>
                      <th className="py-3 text-left font-display font-semibold text-[#2C2C2C]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DF]">
                    {[
                      { status: 400, code: "INVALID_FILE", desc: "Missing or invalid file in request", variant: "error" },
                      { status: 400, code: "UNSUPPORTED_FORMAT", desc: "File format not supported", variant: "error" },
                      { status: 400, code: "FILE_TOO_LARGE", desc: "File exceeds maximum size (100MB)", variant: "error" },
                      { status: 401, code: "UNAUTHORIZED", desc: "Missing or invalid API key", variant: "error" },
                      { status: 401, code: "KEY_REVOKED", desc: "API key has been revoked", variant: "error" },
                      { status: 401, code: "KEY_EXPIRED", desc: "API key has expired", variant: "error" },
                      { status: 429, code: "RATE_LIMIT_EXCEEDED", desc: "Too many requests, wait and retry", variant: "warning" },
                      { status: 500, code: "PROCESSING_ERROR", desc: "Server error during file processing", variant: "error" },
                    ].map((err) => (
                      <tr key={err.code}>
                        <td className="py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-display font-semibold border-[2px] ${
                            err.variant === "warning"
                              ? "bg-[#FFF3E0] text-[#E65100] border-[#FFB74D]"
                              : "bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]"
                          }`}>
                            {err.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <code className="px-2 py-1 bg-[#2C2C2C] text-white rounded text-xs font-mono">
                            {err.code}
                          </code>
                        </td>
                        <td className="py-3 font-body text-[#6B6B6B]">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Supported Formats */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C]">
              <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Supported File Formats</h2>
              <p className="font-body text-sm text-[#6B6B6B] mt-1">50+ formats supported</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Documents", formats: ["PDF", "DOCX", "DOC", "RTF", "ODT", "TXT"], color: "#4A6B5A" },
                  { title: "Spreadsheets", formats: ["XLSX", "XLS", "CSV", "TSV", "ODS"], color: "#2196F3" },
                  { title: "Presentations", formats: ["PPTX", "PPT", "ODP"], color: "#9C27B0" },
                  { title: "Markup", formats: ["HTML", "Markdown", "RST", "AsciiDoc"], color: "#FF9800" },
                  { title: "Images (OCR)", formats: ["PNG", "JPG", "TIFF", "BMP", "WebP"], color: "#F44336" },
                  { title: "Other", formats: ["EPUB", "EML", "MSG", "JSON", "XML"], color: "#607D8B" },
                ].map((cat) => (
                  <div key={cat.title} className="p-4 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
                    <p className="font-display font-semibold text-[#2C2C2C] mb-3">{cat.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.formats.map((format) => (
                        <span
                          key={format}
                          className="px-2.5 py-1 rounded-lg text-xs font-body font-medium border-[2px]"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: cat.color,
                            color: cat.color,
                          }}
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="bg-white rounded-2xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm overflow-hidden">
            <div className="p-6 border-b-[2.5px] border-[#2C2C2C] bg-[#E8EAF6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3F51B5] border-[2.5px] border-[#2C2C2C] flex items-center justify-center">
                  <BookIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#2C2C2C]">Best Practices</h2>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {[
                  { title: "Use environment variables", desc: "Never hardcode API keys. Use environment variables or secret managers." },
                  { title: "Handle rate limits gracefully", desc: "Implement exponential backoff when you receive 429 responses." },
                  { title: "Choose the right chunk strategy", desc: 'Use "semantic" for documents with clear structure, "fixed" for uniform chunks.' },
                  { title: "Rotate keys periodically", desc: "Create new API keys and deprecate old ones for better security." },
                  { title: "Monitor your usage", desc: "Use the /usage endpoint to track consumption and avoid hitting limits." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4A6B5A] flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRightIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-[#2C2C2C]">{item.title}</p>
                      <p className="font-body text-sm text-[#6B6B6B] mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}

// Code Block Component with Copy
function CodeBlock({
  title,
  code,
}: {
  title?: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border-[2px] border-[#2C2C2C] overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#2C2C2C]">
          <span className="text-sm font-body font-medium text-[#FAF8F5]">{title}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-[#3C3C3C] transition-colors"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            ) : (
              <CopyIcon className="w-4 h-4 text-[#FAF8F5]" />
            )}
          </button>
        </div>
      )}
      <div className="relative bg-[#1A1A1A]">
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-[#2C2C2C] transition-colors"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            ) : (
              <CopyIcon className="w-4 h-4 text-[#6B6B6B]" />
            )}
          </button>
        )}
        <pre className="overflow-x-auto p-4 text-sm font-mono text-[#E8E4DF]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Endpoint Section Component
function EndpointSection({
  method,
  path,
  description,
  requestBody,
  responseExample,
}: {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseExample: string;
}) {
  return (
    <div className="space-y-4 p-5 rounded-xl bg-[#FAF8F5] border-[2px] border-[#E8E4DF]">
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold border-[2px] ${
            method === "POST"
              ? "bg-[#E8F5E9] text-[#2E7D32] border-[#4CAF50]"
              : "bg-[#E3F2FD] text-[#1565C0] border-[#2196F3]"
          }`}
        >
          {method}
        </span>
        <code className="px-3 py-1.5 bg-[#2C2C2C] text-[#FAF8F5] rounded-lg text-sm font-mono">
          {path}
        </code>
      </div>
      <p className="font-body text-[#6B6B6B]">{description}</p>
      {requestBody && (
        <div className="space-y-2">
          <p className="font-display font-semibold text-sm text-[#2C2C2C]">Request</p>
          <CodeBlock code={requestBody} />
        </div>
      )}
      <div className="space-y-2">
        <p className="font-display font-semibold text-sm text-[#2C2C2C]">Response</p>
        <CodeBlock code={responseExample} />
      </div>
    </div>
  );
}
