"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ============================================
// CUSTOM SVG ICONS
// ============================================

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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 10H16M16 10L11 5M16 10L11 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 7L10 12L15 7" strokeLinecap="round" strokeLinejoin="round" />
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10 4V16M4 10H16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Pipeline Stage Icons
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function TransformIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function OutputIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16,18 22,12 16,6" />
      <polyline points="8,6 2,12 8,18" />
      <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
    </svg>
  );
}

function ExtrasIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v10M1 12h6m6 0h10" />
    </svg>
  );
}

// Feature Icons
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

function OCRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="8" width="28" height="36" rx="4" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <line x1="8" y1="24" x2="28" y2="24" stroke="#C4705A" strokeWidth="2" />
      <rect x="8" y="14" width="20" height="6" rx="1" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="1.5" />
      <line x1="8" y1="32" x2="24" y2="32" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="38" x2="20" y2="38" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38" cy="24" r="8" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2" />
      <circle cx="38" cy="24" r="3" fill="#4A6B5A" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="6" width="40" height="36" rx="6" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="4" y="6" width="40" height="10" rx="6" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2.5" />
      <line x1="4" y1="26" x2="44" y2="26" stroke="#2C2C2C" strokeWidth="2" />
      <line x1="18" y1="16" x2="18" y2="42" stroke="#2C2C2C" strokeWidth="2" />
      <line x1="32" y1="16" x2="32" y2="42" stroke="#2C2C2C" strokeWidth="2" />
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

function VectorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="12" cy="12" r="6" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2" />
      <circle cx="36" cy="12" r="6" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <circle cx="24" cy="36" r="6" fill="#6B9B8A" stroke="#2C2C2C" strokeWidth="2" />
      <line x1="16" y1="15" x2="21" y2="32" stroke="#2C2C2C" strokeWidth="2" />
      <line x1="32" y1="15" x2="27" y2="32" stroke="#2C2C2C" strokeWidth="2" />
      <line x1="18" y1="12" x2="30" y2="12" stroke="#2C2C2C" strokeWidth="2" />
    </svg>
  );
}

function PrivacyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L6 12V24C6 34 14 42 24 46C34 42 42 34 42 24V12L24 4Z" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="16" y="22" width="16" height="14" rx="3" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <path d="M20 22V18C20 15.8 21.8 14 24 14C26.2 14 28 15.8 28 18V22" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="29" r="2" fill="#FFFFFF" />
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

function APIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="8" width="40" height="32" rx="4" fill="#2C2C2C" stroke="#2C2C2C" strokeWidth="2" />
      <text x="8" y="22" fill="#C4705A" fontSize="6" fontFamily="monospace">POST</text>
      <text x="8" y="32" fill="#6B9B8A" fontSize="6" fontFamily="monospace">/api/convert</text>
      <circle cx="40" cy="12" r="2" fill="#4A6B5A" />
    </svg>
  );
}

// Workflow Diagram Components
function SourceNode({ className, label = "Source" }: { className?: string; label?: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#4A6B5A] flex items-center justify-center">
        <UploadIcon className="w-4 h-4 text-white" />
      </div>
      <span className="font-display font-semibold text-[#1A1A1A]">{label}</span>
    </div>
  );
}

function ProcessNode({ className, label = "Process", color = "#C4705A" }: { className?: string; label?: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm ${className}`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
        <TransformIcon className="w-4 h-4 text-white" />
      </div>
      <span className="font-display font-semibold text-[#1A1A1A]">{label}</span>
    </div>
  );
}

function DestinationNode({ className, label = "Output" }: { className?: string; label?: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-[2.5px] border-[#2C2C2C] neo-shadow-sm ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#6B9B8A] flex items-center justify-center">
        <OutputIcon className="w-4 h-4 text-white" />
      </div>
      <span className="font-display font-semibold text-[#1A1A1A]">{label}</span>
    </div>
  );
}

// Connection Line
function ConnectionLine({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="h-[3px] w-8 bg-[#2C2C2C]" />
      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-[#2C2C2C]" />
    </div>
  );
}


// ============================================
// FAQ ACCORDION
// ============================================

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b-[2.5px] border-[#2C2C2C]">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-6 text-left group cursor-pointer"
      >
        <span className="text-lg font-display font-semibold text-[#1A1A1A] group-hover:text-[#C4705A] transition-colors pr-4">
          {question}
        </span>
        <div
          className={`w-10 h-10 rounded-xl bg-[#F5F2ED] border-[2.5px] border-[#2C2C2C] flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 bg-[#C4705A]" : "neo-shadow-sm"
          }`}
        >
          <ChevronDownIcon className={`w-5 h-5 ${isOpen ? "text-white" : "text-[#2C2C2C]"}`} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-64 pb-6" : "max-h-0"
        }`}
      >
        <p className="text-base font-body text-[#6B6B6B] leading-relaxed pr-16">
          {answer}
        </p>
      </div>
    </div>
  );
}

// ============================================
// FEATURE CARD
// ============================================

function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "#F5F2ED",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}) {
  return (
    <div className="neo-card p-6 group hover:translate-y-[-4px] transition-all duration-300">
      <div
        className="w-14 h-14 rounded-xl neo-border flex items-center justify-center mb-4"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-display font-bold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm font-body text-[#6B6B6B] leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================
// MAIN LANDING PAGE
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    {
      question: "What file formats does FileForge support?",
      answer:
        "We support PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, CSV, HTML, TXT, Markdown, JSON, XML, and common image formats (PNG, JPG, TIFF, BMP, GIF). New formats are added regularly based on user requests.",
    },
    {
      question: "How does semantic chunking work?",
      answer:
        "Unlike fixed-size chunking that splits text at arbitrary points, semantic chunking respects document structure. We split at natural boundaries—headings, sections, paragraphs—while respecting token limits. This preserves context and improves downstream LLM performance.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. Files are processed in isolated environments and automatically deleted after processing. We don't retain data or use it for training. Enterprise customers can deploy FileForge on their own infrastructure for complete control.",
    },
    {
      question: "Can I self-host FileForge?",
      answer:
        "Yes. Our Enterprise plan includes self-hosted deployment options with Docker images and Kubernetes configurations. Contact our sales team for architecture guidance and licensing details.",
    },
    {
      question: "What's the processing latency?",
      answer:
        "Most documents process in 1-3 seconds. Large documents (100+ pages) may take up to 30 seconds. We also offer async processing with webhooks for batch workloads, allowing you to process thousands of documents without blocking.",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      description: "For exploration and personal projects",
      features: [
        "100 pages per month",
        "5 file formats",
        "Basic chunking",
        "Community support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For teams building production applications",
      features: [
        "10,000 pages per month",
        "All file formats",
        "Semantic chunking",
        "Table extraction",
        "Priority support",
        "API access",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For organizations with scale and compliance needs",
      features: [
        "Unlimited pages",
        "All Professional features",
        "Self-hosted deployment",
        "Dedicated support",
        "SSO & audit logs",
        "Custom SLA",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2C2C2C] border-b-[3px] border-[#1A1A1A]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 cursor-pointer"
            >
              <LogoMark className="w-9 h-9" />
              <span className="text-xl font-display font-bold text-[#FAF8F5] tracking-tight">
                FileForge
              </span>
            </button>

            {/* Center Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Product", href: "#upload" },
                { label: "Features", href: "#transform" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="px-4 py-2 text-sm font-display font-medium text-[#A0A0A0] hover:text-[#FAF8F5] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="hidden sm:flex items-center gap-1 px-4 py-2 text-sm font-display font-medium text-[#A0A0A0] hover:text-[#FAF8F5] transition-colors cursor-pointer"
              >
                Login
                <ArrowRightIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push("/upload")}
                className="px-5 py-2.5 text-sm font-display font-semibold bg-[#C4705A] text-white rounded-xl border-[2.5px] border-[#2C2C2C] hover:bg-[#B5614B] transition-colors cursor-pointer"
              >
                Try for Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div
              className="max-w-xl"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
                opacity: Math.max(0, 1 - scrollY / 800),
              }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F2ED] border-[2px] border-[#2C2C2C] neo-shadow-sm mb-8">
                <div className="w-2 h-2 rounded-full bg-[#4A6B5A] animate-pulse" />
                <span className="text-xs font-display font-semibold text-[#2C2C2C] uppercase tracking-wide">
                  Privacy-First Processing
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-[#1A1A1A] leading-[1.1] mb-6">
                One platform,{" "}
                <span className="text-[#C4705A]">packed with</span>{" "}
                performance.
              </h1>

              {/* Subline */}
              <p className="text-lg lg:text-xl font-body text-[#6B6B6B] mb-10 leading-relaxed">
                FileForge isn't just one tool, it's a complete document-to-data pipeline.
                Extract, transform, and deliver structured data ready for your AI workflows.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => router.push("/upload")}
                  className="neo-btn bg-[#C4705A] text-white px-8 py-4 text-base font-display font-semibold flex items-center gap-2 cursor-pointer"
                >
                  Start Converting
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const element = document.querySelector("#upload");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="neo-btn-outline px-8 py-4 text-base font-display font-semibold text-[#2C2C2C] cursor-pointer"
                >
                  See How It Works
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-10 border-t-[2px] border-[#EDEAE4]">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-[#1A1A1A]">30+</div>
                  <div className="text-xs font-body text-[#6B6B6B]">File Formats</div>
                </div>
                <div className="w-px h-10 bg-[#EDEAE4]" />
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-[#1A1A1A]">{"<3s"}</div>
                  <div className="text-xs font-body text-[#6B6B6B]">Avg. Processing</div>
                </div>
                <div className="w-px h-10 bg-[#EDEAE4]" />
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-[#1A1A1A]">99.9%</div>
                  <div className="text-xs font-body text-[#6B6B6B]">Uptime SLA</div>
                </div>
              </div>
            </div>

            {/* Right - Hero Illustration/Workflow */}
            <div
              className="relative"
              style={{
                transform: `translateY(${-scrollY * 0.05}px)`,
              }}
            >
              <div className="relative bg-[#F5F2ED] rounded-3xl border-[3px] border-[#2C2C2C] neo-shadow-lg p-8 overflow-hidden">
                {/* Decorative clouds/shapes */}
                <div className="absolute top-4 right-4 w-20 h-12 bg-white/60 rounded-full blur-sm" />
                <div className="absolute top-8 right-16 w-16 h-10 bg-white/40 rounded-full blur-sm" />

                {/* Workflow diagram */}
                <div className="relative z-10 flex flex-col items-center gap-4 py-8">
                  {/* Row 1 - Sources */}
                  <div className="flex items-center gap-4">
                    <SourceNode label="PDF" />
                    <SourceNode label="DOCX" />
                    <SourceNode label="Image" />
                  </div>

                  {/* Connection */}
                  <div className="flex flex-col items-center">
                    <div className="w-[3px] h-8 bg-[#2C2C2C]" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#2C2C2C]" />
                  </div>

                  {/* Row 2 - Processing */}
                  <ProcessNode label="FileForge" color="#C4705A" />

                  {/* Connection */}
                  <div className="flex flex-col items-center">
                    <div className="w-[3px] h-8 bg-[#2C2C2C]" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#2C2C2C]" />
                  </div>

                  {/* Row 3 - Output */}
                  <div className="flex items-center gap-4">
                    <DestinationNode label="JSON" />
                    <DestinationNode label="Vectors" />
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute bottom-4 left-4 px-3 py-2 bg-white rounded-lg border-[2px] border-[#2C2C2C] neo-shadow-sm">
                  <span className="text-xs font-mono text-[#4A6B5A]">{"{ structured: true }"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* UPLOAD SECTION */}
      {/* ============================================ */}
      <section
        id="upload"
        className="py-20 lg:py-32 scroll-mt-20"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="rounded-3xl border-[3px] border-[#4A6B5A] bg-[#4A6B5A]/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-[#4A6B5A] border-b-[3px] border-[#4A6B5A]">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <UploadIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">Upload</span>
            </div>

            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Content */}
                <div>
                  <span className="text-sm font-display font-semibold text-[#4A6B5A] uppercase tracking-wide mb-4 block">
                    Supports 30+ Formats
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                    Everything from PDFs to spreadsheets.
                  </h2>
                  <p className="text-lg font-body text-[#6B6B6B] leading-relaxed mb-8">
                    Connecting to unstructured data shouldn't be complex. Drop any file into FileForge—
                    PDFs, Word documents, Excel sheets, images, and more. No configuration required.
                    Every format works the same way.
                  </p>

                  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-[2px] border-[#2C2C2C] neo-shadow-sm hover:bg-[#F5F2ED] transition-colors cursor-pointer">
                    <PlusIcon className="w-4 h-4 text-[#4A6B5A]" />
                    <span className="text-sm font-display font-semibold text-[#1A1A1A]">View All Formats</span>
                  </button>
                </div>

                {/* Right - Illustration */}
                <div className="relative bg-[#F5F2ED] rounded-2xl border-[2.5px] border-[#2C2C2C] p-8">
                  <div className="flex flex-col items-center gap-6">
                    {/* Drop zone mockup */}
                    <div className="w-full p-8 border-[3px] border-dashed border-[#4A6B5A] rounded-xl bg-white/50 text-center">
                      <UploadIcon className="w-12 h-12 text-[#4A6B5A] mx-auto mb-4" />
                      <p className="font-display font-semibold text-[#1A1A1A]">Drop file to test</p>
                      <p className="text-sm font-body text-[#6B6B6B] mt-1">or click to browse</p>
                    </div>

                    {/* Format chips */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {["PDF", "DOCX", "XLSX", "PNG", "HTML", "CSV"].map((format) => (
                        <span
                          key={format}
                          className="px-3 py-1.5 text-xs font-display font-semibold bg-white border-[2px] border-[#2C2C2C] rounded-lg"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-features */}
              <div className="grid md:grid-cols-3 gap-6 mt-12 pt-12 border-t-[2px] border-[#4A6B5A]/20">
                <FeatureCard
                  icon={FileTypesIcon}
                  title="Multi-Format Input"
                  description="PDF, DOCX, XLSX, PPTX, HTML, Markdown, CSV, JSON, XML, and images—unified into one output format."
                  color="#4A6B5A"
                />
                <FeatureCard
                  icon={OCRIcon}
                  title="OCR & Image Parsing"
                  description="Extract text from scanned documents and images with high-accuracy optical character recognition."
                  color="#4A6B5A"
                />
                <FeatureCard
                  icon={TableIcon}
                  title="Table Detection"
                  description="Automatically identify and preserve table structures with row-column relationships intact."
                  color="#4A6B5A"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TRANSFORM SECTION */}
      {/* ============================================ */}
      <section
        id="transform"
        className="py-20 lg:py-32 scroll-mt-20"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="rounded-3xl border-[3px] border-[#C4705A] bg-[#C4705A]/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-[#C4705A] border-b-[3px] border-[#C4705A]">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TransformIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">Transform</span>
            </div>

            <div className="p-8 lg:p-12">
              {/* Feature 1 - Chunking */}
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div className="order-2 lg:order-1 relative bg-[#F5F2ED] rounded-2xl border-[2.5px] border-[#2C2C2C] p-8">
                  {/* Chunking visualization */}
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border-[2px] border-[#2C2C2C]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#C4705A]" />
                        <span className="text-xs font-display font-semibold text-[#6B6B6B]">TITLE</span>
                      </div>
                      <div className="h-3 w-3/4 bg-[#2C2C2C] rounded" />
                    </div>
                    <div className="p-4 bg-white rounded-xl border-[2px] border-[#2C2C2C]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#4A6B5A]" />
                        <span className="text-xs font-display font-semibold text-[#6B6B6B]">PARAGRAPH</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-[#EDEAE4] rounded" />
                        <div className="h-2 w-5/6 bg-[#EDEAE4] rounded" />
                        <div className="h-2 w-4/6 bg-[#EDEAE4] rounded" />
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border-[2px] border-[#2C2C2C]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#6B9B8A]" />
                        <span className="text-xs font-display font-semibold text-[#6B6B6B]">TABLE</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-4 bg-[#EDEAE4] rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <span className="text-sm font-display font-semibold text-[#C4705A] uppercase tracking-wide mb-4 block">
                    Semantic Chunking
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                    Intelligent splitting for better AI results.
                  </h2>
                  <p className="text-lg font-body text-[#6B6B6B] leading-relaxed mb-8">
                    Chunking is harder than it looks. Too little context, and meaning is lost. Too much,
                    and precision fades. Our smart chunking strategies create the right chunks for your data,
                    so your AI sees what matters.
                  </p>

                  <div className="space-y-3">
                    {["By document structure", "By token count", "By similarity"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[#C4705A] flex items-center justify-center">
                          <CheckmarkIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-body text-[#1A1A1A]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 2 - Metadata */}
              <div className="grid lg:grid-cols-2 gap-12 items-center pt-12 border-t-[2px] border-[#C4705A]/20">
                <div>
                  <span className="text-sm font-display font-semibold text-[#C4705A] uppercase tracking-wide mb-4 block">
                    Rich Metadata
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                    More signal, less noise.
                  </h2>
                  <p className="text-lg font-body text-[#6B6B6B] leading-relaxed mb-8">
                    Raw data isn't always ready for AI. FileForge enriches your content with metadata,
                    structure, and context automatically. Page numbers, element types, coordinates, and more—
                    everything you need to retrieve and understand your data with precision.
                  </p>

                  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-[2px] border-[#2C2C2C] neo-shadow-sm hover:bg-[#F5F2ED] transition-colors cursor-pointer">
                    <PlusIcon className="w-4 h-4 text-[#C4705A]" />
                    <span className="text-sm font-display font-semibold text-[#1A1A1A]">View Metadata Fields</span>
                  </button>
                </div>

                <div className="relative bg-[#2C2C2C] rounded-2xl border-[2.5px] border-[#2C2C2C] p-6 font-mono text-sm overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                  </div>
                  <pre className="text-[#FAF8F5] overflow-x-auto">
                    <code>{`{
  "chunk": {
    "text": "Q4 Revenue Report",
    "type": "Title",
    "page": 1,
    "tokens": 128,
    "metadata": {
      "font_size": 24,
      "is_bold": true,
      "coordinates": {...}
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OUTPUT SECTION */}
      {/* ============================================ */}
      <section
        id="output"
        className="py-20 lg:py-32 scroll-mt-20"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="rounded-3xl border-[3px] border-[#6B9B8A] bg-[#6B9B8A]/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-[#6B9B8A] border-b-[3px] border-[#6B9B8A]">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <OutputIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">Output</span>
            </div>

            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Content */}
                <div>
                  <span className="text-sm font-display font-semibold text-[#6B9B8A] uppercase tracking-wide mb-4 block">
                    LLM-Ready Format
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                    Point. Send. Done.
                  </h2>
                  <p className="text-lg font-body text-[#6B6B6B] leading-relaxed mb-8">
                    Deliver your enriched data exactly where it needs to go. Clean JSON output ready for
                    vector databases, RAG pipelines, and LLM applications. No custom code. No delays.
                    Just smooth, reliable data flow.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {["Pinecone", "Weaviate", "Qdrant", "PostgreSQL", "S3"].map((dest) => (
                      <div
                        key={dest}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-[2px] border-[#2C2C2C]"
                      >
                        <div className="w-4 h-4 rounded bg-[#6B9B8A]" />
                        <span className="text-sm font-display font-semibold text-[#1A1A1A]">{dest}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right - Illustration */}
                <div className="relative bg-[#F5F2ED] rounded-2xl border-[2.5px] border-[#2C2C2C] p-8">
                  <div className="flex flex-col items-center gap-6">
                    {/* JSON output mockup */}
                    <div className="w-full p-6 bg-white rounded-xl border-[2px] border-[#2C2C2C]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-display font-semibold text-[#1A1A1A]">Output Preview</span>
                        <span className="px-2 py-1 text-xs font-mono bg-[#4A6B5A] text-white rounded">JSON</span>
                      </div>
                      <div className="font-mono text-xs text-[#6B6B6B] space-y-1">
                        <div><span className="text-[#C4705A]">"filename"</span>: "report.pdf",</div>
                        <div><span className="text-[#C4705A]">"chunks"</span>: [...],</div>
                        <div><span className="text-[#C4705A]">"total_tokens"</span>: 8420</div>
                      </div>
                    </div>

                    {/* Arrows to destinations */}
                    <div className="flex items-center gap-4">
                      <ConnectionLine />
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#6B9B8A] neo-border flex items-center justify-center">
                          <VectorIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#4A6B5A] neo-border flex items-center justify-center">
                          <JSONIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-features */}
              <div className="grid md:grid-cols-3 gap-6 mt-12 pt-12 border-t-[2px] border-[#6B9B8A]/20">
                <FeatureCard
                  icon={JSONIcon}
                  title="Clean JSON Output"
                  description="Structured, consistent JSON with chunks, metadata, and token counts—ready for any downstream application."
                  color="#6B9B8A"
                />
                <FeatureCard
                  icon={VectorIcon}
                  title="Vector-Ready"
                  description="Output optimized for embedding models and vector databases. Perfect for RAG and semantic search."
                  color="#6B9B8A"
                />
                <FeatureCard
                  icon={APIIcon}
                  title="REST API"
                  description="Simple API with sync and async endpoints. Process single files or batch thousands with webhooks."
                  color="#6B9B8A"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PLUS SECTION */}
      {/* ============================================ */}
      <section
        id="plus"
        className="py-20 lg:py-32 scroll-mt-20"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="rounded-3xl border-[3px] border-[#8B7355] bg-[#8B7355]/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-[#8B7355] border-b-[3px] border-[#8B7355]">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ExtrasIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">Plus +</span>
            </div>

            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <span className="text-sm font-display font-semibold text-[#8B7355] uppercase tracking-wide mb-4 block">
                    Enterprise-Grade Features
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                    Security, reliability, and compliance baked in.
                  </h2>
                  <p className="text-lg font-body text-[#6B6B6B] leading-relaxed mb-8">
                    Built for enterprises from the ground up. Role-based access, fine-grained permissions,
                    deep observability, robust error handling, and compliance support. Move fast without
                    sacrificing control or security.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "SOC 2 Type II",
                      "Self-hosted option",
                      "SSO & SAML",
                      "Audit logs",
                      "99.9% SLA",
                      "Dedicated support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#8B7355] flex items-center justify-center">
                          <CheckmarkIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-body text-[#1A1A1A]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative bg-[#F5F2ED] rounded-2xl border-[2.5px] border-[#2C2C2C] p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureCard
                      icon={PrivacyIcon}
                      title="Privacy First"
                      description="Files processed in isolation, auto-deleted after use."
                      color="#8B7355"
                    />
                    <FeatureCard
                      icon={SpeedIcon}
                      title="Fast & Reliable"
                      description="Sub-3s processing with enterprise SLA."
                      color="#8B7355"
                    />
                  </div>
                </div>
              </div>

              {/* API Section */}
              <div className="pt-12 border-t-[2px] border-[#8B7355]/20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="relative bg-[#2C2C2C] rounded-2xl border-[2.5px] border-[#2C2C2C] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 text-xs font-mono bg-[#C4705A] text-white rounded">POST</span>
                      <span className="text-sm font-mono text-[#A0A0A0]">/api/v1/convert</span>
                    </div>
                    <pre className="text-sm font-mono text-[#FAF8F5] overflow-x-auto">
                      <code>{`curl -X POST \\
  -H "Authorization: Bearer $API_KEY" \\
  -F "file=@document.pdf" \\
  -F "chunk_strategy=semantic" \\
  https://api.fileforge.dev/v1/convert`}</code>
                    </pre>
                  </div>

                  <div>
                    <span className="text-sm font-display font-semibold text-[#8B7355] uppercase tracking-wide mb-4 block">
                      API, UI, and SDK
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-6">
                      Interface options for everyone.
                    </h2>
                    <p className="text-lg font-body text-[#6B6B6B] leading-relaxed">
                      Use the API for full programmatic control. Use the UI to configure and run pipelines
                      without code. Or integrate our SDK into your existing workflows. However you work,
                      FileForge fits right in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING SECTION */}
      {/* ============================================ */}
      <section id="pricing" className="py-20 lg:py-32 bg-[#F5F2ED] border-y-[3px] border-[#2C2C2C]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-sm font-display font-semibold text-[#C4705A] uppercase tracking-wide mb-4 block">
              Pricing
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg font-body text-[#6B6B6B] max-w-md mx-auto">
              Start free, scale when you're ready. No surprises.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border-[2.5px] transition-all hover:translate-y-[-4px] ${
                  plan.highlighted
                    ? "border-[#C4705A] bg-white neo-shadow-clay"
                    : "border-[#2C2C2C] bg-white neo-shadow"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#C4705A] border-[2px] border-[#2C2C2C] rounded-lg neo-shadow-sm">
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-display font-bold text-[#1A1A1A] mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-display font-bold text-[#1A1A1A]">
                      {plan.price}
                    </span>
                    <span className="text-base font-body text-[#6B6B6B]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm font-body text-[#6B6B6B]">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          plan.highlighted ? "bg-[#C4705A]" : "bg-[#4A6B5A]"
                        }`}
                      >
                        <CheckmarkIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-body text-[#6B6B6B]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/upload")}
                  className={`w-full py-3.5 rounded-xl text-sm font-display font-semibold transition-all cursor-pointer ${
                    plan.highlighted
                      ? "neo-btn bg-[#C4705A] text-white"
                      : "neo-btn-outline text-[#2C2C2C]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ SECTION */}
      {/* ============================================ */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="text-sm font-display font-semibold text-[#C4705A] uppercase tracking-wide mb-4 block">
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg font-body text-[#6B6B6B]">
              Everything you need to know about FileForge.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="border-t-[2.5px] border-[#2C2C2C]">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="py-20 lg:py-32 bg-[#2C2C2C]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#3A3A3A] rounded-lg border-[2px] border-[#4A4A4A] text-sm font-display font-semibold text-[#FAF8F5] mb-8">
            Try It Out Now
          </span>
          <h2 className="text-3xl lg:text-5xl font-display font-bold text-[#FAF8F5] mb-6">
            Ready for a demo?
          </h2>
          <p className="text-lg font-body text-[#A0A0A0] mb-10 max-w-xl mx-auto">
            See how FileForge simplifies data workflows, reduces engineering effort, and scales effortlessly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push("/upload")}
              className="px-8 py-4 bg-[#C4705A] text-white rounded-xl border-[2.5px] border-[#C4705A] text-base font-display font-semibold flex items-center gap-2 hover:bg-[#B5614B] transition-colors cursor-pointer"
            >
              Try for Free
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-transparent text-[#FAF8F5] rounded-xl border-[2.5px] border-[#4A4A4A] text-base font-display font-semibold hover:bg-[#3A3A3A] transition-colors cursor-pointer">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="bg-[#1A1A1A] border-t-[3px] border-[#2C2C2C]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-3 mb-5 cursor-pointer"
              >
                <LogoMark className="w-9 h-9" />
                <span className="text-xl font-display font-bold text-[#FAF8F5]">
                  FileForge
                </span>
              </button>
              <p className="text-sm font-body text-[#A0A0A0] leading-relaxed">
                Transform any file into LLM-ready structured data with precision,
                privacy, and craft.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-display font-semibold text-[#FAF8F5] uppercase tracking-wide mb-5">
                Product
              </h4>
              <div className="space-y-3">
                {["Features", "Pricing", "Changelog", "Roadmap"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm font-body text-[#A0A0A0] hover:text-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-display font-semibold text-[#FAF8F5] uppercase tracking-wide mb-5">
                Resources
              </h4>
              <div className="space-y-3">
                {["Documentation", "API Reference", "Examples", "Status"].map(
                  (item) => (
                    <a
                      key={item}
                      href="#"
                      className="block text-sm font-body text-[#A0A0A0] hover:text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      {item}
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-display font-semibold text-[#FAF8F5] uppercase tracking-wide mb-5">
                Company
              </h4>
              <div className="space-y-3">
                {["About", "Contact", "Privacy", "Terms"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm font-body text-[#A0A0A0] hover:text-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t-[2px] border-[#2C2C2C] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-body text-[#6B6B6B]">
              © 2024 FileForge. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Twitter", "GitHub", "Discord"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs font-body text-[#6B6B6B] hover:text-[#FAF8F5] transition-colors cursor-pointer"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
