"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ============================================
// CUSTOM SVG ICONS - No stock icons, fully custom
// ============================================

function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      {/* Layered index cards motif */}
      <rect x="8" y="12" width="24" height="20" rx="3" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="5" y="8" width="24" height="20" rx="3" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="2" y="4" width="24" height="20" rx="3" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* Content lines */}
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

// Hero Illustration - Chaos to Clarity transformation
function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 480 360" fill="none">
      {/* Background shape */}
      <rect x="40" y="40" width="400" height="280" rx="20" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />

      {/* Left side - Chaotic files */}
      <g transform="translate(60, 80)">
        {/* Messy paper 1 - rotated */}
        <g transform="rotate(-12, 60, 80)">
          <rect x="10" y="30" width="100" height="130" rx="6" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2" />
          <line x1="22" y1="50" x2="90" y2="50" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="62" x2="78" y2="62" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="74" x2="85" y2="74" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
          <rect x="22" y="88" width="40" height="30" rx="2" fill="#EDEAE4" stroke="#D4D4D4" strokeWidth="1.5" />
          <line x1="22" y1="130" x2="70" y2="130" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Messy paper 2 - opposite rotation */}
        <g transform="rotate(8, 80, 100)">
          <rect x="40" y="50" width="90" height="120" rx="6" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2" />
          <line x1="52" y1="68" x2="110" y2="68" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
          <line x1="52" y1="80" x2="100" y2="80" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
          <rect x="52" y="94" width="60" height="24" rx="2" fill="#EDEAE4" stroke="#D4D4D4" strokeWidth="1.5" />
          <line x1="52" y1="130" x2="95" y2="130" stroke="#D4D4D4" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Scattered image element */}
        <g transform="rotate(-5, 30, 160)">
          <rect x="5" y="140" width="50" height="40" rx="4" fill="#6B9B8A" stroke="#2C2C2C" strokeWidth="2" opacity="0.6" />
          <circle cx="18" cy="152" r="6" fill="#4A6B5A" />
          <path d="M10 172L22 162L32 168L48 158" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Floating question marks to indicate confusion */}
        <text x="110" y="45" fill="#C4705A" fontSize="18" fontWeight="bold">?</text>
        <text x="130" y="35" fill="#C4705A" fontSize="14" fontWeight="bold">?</text>
      </g>

      {/* Center - Arrow transformation */}
      <g transform="translate(200, 140)">
        {/* Arrow body with motion lines */}
        <line x1="0" y1="40" x2="60" y2="40" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 30L70 40L50 50" stroke="#2C2C2C" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Motion lines */}
        <line x1="-10" y1="32" x2="10" y2="32" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="-5" y1="48" x2="15" y2="48" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </g>

      {/* Right side - Clean structured output (Index cards motif) */}
      <g transform="translate(280, 60)">
        {/* Back card */}
        <rect x="20" y="20" width="140" height="180" rx="10" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="2.5" />

        {/* Middle card */}
        <rect x="10" y="10" width="140" height="180" rx="10" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />

        {/* Front card - main structured data */}
        <rect x="0" y="0" width="140" height="180" rx="10" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />

        {/* Punch holes at top */}
        <circle cx="25" cy="16" r="5" fill="#FAF8F5" stroke="#2C2C2C" strokeWidth="1.5" />
        <circle cx="70" cy="16" r="5" fill="#FAF8F5" stroke="#2C2C2C" strokeWidth="1.5" />
        <circle cx="115" cy="16" r="5" fill="#FAF8F5" stroke="#2C2C2C" strokeWidth="1.5" />

        {/* Clean structured content */}
        <rect x="14" y="32" width="50" height="8" rx="2" fill="#C4705A" />
        <line x1="14" y1="52" x2="126" y2="52" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="66" x2="110" y2="66" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="80" x2="118" y2="80" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />

        {/* Clean table representation */}
        <rect x="14" y="96" width="112" height="50" rx="4" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="1.5" />
        <line x1="14" y1="112" x2="126" y2="112" stroke="#2C2C2C" strokeWidth="1.5" />
        <line x1="52" y1="96" x2="52" y2="146" stroke="#2C2C2C" strokeWidth="1.5" />
        <line x1="90" y1="96" x2="90" y2="146" stroke="#2C2C2C" strokeWidth="1.5" />

        {/* JSON bracket hint */}
        <text x="14" y="168" fill="#4A6B5A" fontSize="14" fontFamily="monospace" fontWeight="600">{"{ }"}</text>
        <text x="44" y="168" fill="#6B6B6B" fontSize="11" fontFamily="monospace">structured</text>
      </g>

      {/* Checkmark badge */}
      <g transform="translate(390, 200)">
        <circle cx="20" cy="20" r="18" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2.5" />
        <path d="M12 20L18 26L28 14" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// Process Step Icons
function UploadStepIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="12" width="48" height="44" rx="8" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <path d="M32 24V44" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 32L32 24L40 32" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="6" width="32" height="10" rx="4" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2" />
    </svg>
  );
}

function ExtractStepIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <rect x="6" y="8" width="36" height="48" rx="6" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="28" x2="30" y2="28" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="36" x2="32" y2="36" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="42" width="18" height="8" rx="2" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="1.5" />
      {/* Extraction arrows */}
      <path d="M42 28H54" stroke="#C4705A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 22L56 28L48 34" stroke="#C4705A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 40H54" stroke="#4A6B5A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 34L56 40L48 46" stroke="#4A6B5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StructureStepIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      {/* Stacked cards */}
      <rect x="14" y="16" width="40" height="40" rx="6" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="2" />
      <rect x="10" y="12" width="40" height="40" rx="6" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2" />
      <rect x="6" y="8" width="40" height="40" rx="6" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* JSON brackets */}
      <text x="14" y="26" fill="#4A6B5A" fontSize="14" fontFamily="monospace" fontWeight="700">{"{"}</text>
      <line x1="22" y1="30" x2="38" y2="30" stroke="#C4705A" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="34" y2="38" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <text x="14" y="50" fill="#4A6B5A" fontSize="14" fontFamily="monospace" fontWeight="700">{"}"}</text>
      {/* Checkmark */}
      <circle cx="52" cy="12" r="10" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <path d="M47 12L50 15L57 8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Feature Icons
function OCRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="8" width="28" height="36" rx="4" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* Scan line */}
      <line x1="8" y1="24" x2="28" y2="24" stroke="#C4705A" strokeWidth="2" />
      <rect x="8" y="14" width="20" height="6" rx="1" fill="#EDEAE4" stroke="#2C2C2C" strokeWidth="1.5" />
      <line x1="8" y1="32" x2="24" y2="32" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="38" x2="20" y2="38" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" />
      {/* Eye/scan indicator */}
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
      {/* Stacked chunks */}
      <rect x="6" y="6" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="6" y="20" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      <rect x="6" y="34" width="36" height="10" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* Accent lines */}
      <line x1="12" y1="11" x2="26" y2="11" stroke="#C4705A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="25" x2="30" y2="25" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="39" x2="24" y2="39" stroke="#6B9B8A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FormatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      {/* File icons */}
      <rect x="4" y="8" width="16" height="20" rx="3" fill="#C4705A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="7" y="22" fill="#FFFFFF" fontSize="8" fontWeight="700">PDF</text>
      <rect x="16" y="16" width="16" height="20" rx="3" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="19" y="30" fill="#FFFFFF" fontSize="7" fontWeight="700">DOC</text>
      <rect x="28" y="12" width="16" height="20" rx="3" fill="#6B9B8A" stroke="#2C2C2C" strokeWidth="2" />
      <text x="30" y="26" fill="#FFFFFF" fontSize="7" fontWeight="700">XLS</text>
      {/* Arrow to JSON */}
      <path d="M24 38V44" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 42L24 46L28 42" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrivacyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      {/* Shield */}
      <path d="M24 4L6 12V24C6 34 14 42 24 46C34 42 42 34 42 24V12L24 4Z" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* Lock */}
      <rect x="16" y="22" width="16" height="14" rx="3" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2" />
      <path d="M20 22V18C20 15.8 21.8 14 24 14C26.2 14 28 15.8 28 18V22" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="29" r="2" fill="#FFFFFF" />
    </svg>
  );
}

function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      {/* Speedometer arc */}
      <path d="M8 32C8 20.9 16.9 12 28 12" stroke="#EDEAE4" strokeWidth="6" strokeLinecap="round" />
      <path d="M8 32C8 24.3 12.3 17.6 18.5 14" stroke="#C4705A" strokeWidth="6" strokeLinecap="round" />
      {/* Needle */}
      <circle cx="24" cy="32" r="4" fill="#2C2C2C" />
      <path d="M24 32L36 20" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" />
      {/* Speed lines */}
      <line x1="38" y1="26" x2="44" y2="26" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="32" x2="46" y2="32" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="38" x2="42" y2="38" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Security Badge Icon
function SecurityBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none">
      {/* Outer ring with punch holes */}
      <circle cx="60" cy="60" r="54" fill="#F5F2ED" stroke="#2C2C2C" strokeWidth="3" />
      {/* Punch holes around edge */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <circle
          key={i}
          cx={60 + 46 * Math.cos((angle * Math.PI) / 180)}
          cy={60 + 46 * Math.sin((angle * Math.PI) / 180)}
          r="4"
          fill="#FAF8F5"
          stroke="#2C2C2C"
          strokeWidth="1.5"
        />
      ))}
      {/* Inner shield */}
      <path d="M60 20L30 34V58C30 76 42 90 60 98C78 90 90 76 90 58V34L60 20Z" fill="#4A6B5A" stroke="#2C2C2C" strokeWidth="2.5" />
      {/* Lock icon */}
      <rect x="48" y="52" width="24" height="20" rx="4" fill="#FFFFFF" stroke="#2C2C2C" strokeWidth="2" />
      <path d="M52 52V46C52 41.6 55.6 38 60 38C64.4 38 68 41.6 68 46V52" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="62" r="3" fill="#4A6B5A" />
      <line x1="60" y1="64" x2="60" y2="68" stroke="#4A6B5A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Monogram for testimonials
function Monogram({ initials, className }: { initials: string; className?: string }) {
  return (
    <div className={`w-14 h-14 rounded-xl bg-[#F5F2ED] border-[2.5px] border-[#2C2C2C] flex items-center justify-center neo-shadow-sm ${className}`}>
      <span className="text-lg font-display font-bold text-[#2C2C2C]">{initials}</span>
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
// MAIN LANDING PAGE
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const processSteps = [
    {
      icon: UploadStepIcon,
      number: "01",
      title: "Upload",
      description:
        "Drop any file into FileForge. We accept PDFs, documents, spreadsheets, images, and 30+ formats without configuration.",
    },
    {
      icon: ExtractStepIcon,
      number: "02",
      title: "Extract",
      description:
        "Our parsing engine identifies structure, extracts text, detects tables, and processes images with OCR precision.",
    },
    {
      icon: StructureStepIcon,
      number: "03",
      title: "Structure",
      description:
        "Receive clean, semantically chunked JSON with metadata—ready for vector databases, RAG pipelines, and LLM applications.",
    },
  ];

  const features = [
    {
      icon: OCRIcon,
      title: "OCR & Image Parsing",
      description:
        "Extract text from scanned documents and images with high-accuracy optical character recognition.",
    },
    {
      icon: TableIcon,
      title: "Table Detection",
      description:
        "Automatically identify and preserve table structures with row-column relationships intact.",
    },
    {
      icon: ChunkIcon,
      title: "Semantic Chunking",
      description:
        "Intelligent splitting by document structure—headings, sections, paragraphs—not arbitrary character counts.",
    },
    {
      icon: FormatIcon,
      title: "Multi-Format Input",
      description:
        "PDF, DOCX, XLSX, PPTX, HTML, Markdown, CSV, JSON, XML, and images—unified into one output format.",
    },
    {
      icon: PrivacyIcon,
      title: "Local Processing",
      description:
        "Your files never leave your infrastructure. Process sensitive documents with complete privacy.",
    },
    {
      icon: SpeedIcon,
      title: "Fast & Reliable",
      description:
        "Most documents process in under 3 seconds. Enterprise-grade reliability with automatic retries.",
    },
  ];

  const trustPoints = [
    "Files processed in isolated environments",
    "Automatic deletion after processing",
    "No data retention or training",
    "Self-hosted deployment available",
    "SOC 2 Type II compliant",
    "End-to-end encryption",
  ];

  const testimonials = [
    {
      quote:
        "FileForge replaced three tools in our document pipeline. The JSON output is exactly what our RAG system needs—clean, structured, consistent.",
      author: "Sarah Chen",
      role: "ML Engineer, Series B Startup",
      initials: "SC",
    },
    {
      quote:
        "We process 10,000+ invoices monthly. Table extraction accuracy went from 87% to 99.2% after switching. The ROI was immediate.",
      author: "Marcus Webb",
      role: "Head of Operations, FinTech",
      initials: "MW",
    },
    {
      quote:
        "Finally, document processing that doesn't require a PhD to configure. Drop files in, get structured data out. As it should be.",
      author: "Elena Rodriguez",
      role: "CTO, AI Research Lab",
      initials: "ER",
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

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-sm border-b-[2.5px] border-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 cursor-pointer"
            >
              <LogoMark className="w-9 h-9" />
              <span className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
                FileForge
              </span>
            </button>

            {/* Center Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Features", href: "#features" },
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
                  className="px-4 py-2 text-sm font-display font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="hidden sm:block px-4 py-2 text-sm font-display font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer">
                Log in
              </button>
              <button
                onClick={() => router.push("/transform")}
                className="neo-btn bg-[#C4705A] text-white px-5 py-2.5 text-sm font-display font-semibold cursor-pointer"
              >
                Try it Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F2ED] border-[2px] border-[#2C2C2C] neo-shadow-sm mb-8">
                <div className="w-2 h-2 rounded-full bg-[#4A6B5A]" />
                <span className="text-xs font-display font-semibold text-[#2C2C2C] uppercase tracking-wide">
                  Privacy-First Processing
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-display text-4xl sm:text-5xl lg:text-[3.5rem] text-[#1A1A1A] mb-6">
                Transform Any File Into{" "}
                <span className="text-[#C4705A]">LLM-Ready Clarity</span>
              </h1>

              {/* Subline */}
              <p className="text-body text-lg text-[#6B6B6B] mb-10 max-w-md">
                A precision tool that converts PDFs, documents, spreadsheets, and
                images into clean, structured JSON—built for AI workflows that
                demand accuracy.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => router.push("/transform")}
                  className="neo-btn bg-[#C4705A] text-white px-7 py-3.5 text-base font-display font-semibold flex items-center gap-2 cursor-pointer"
                >
                  Start Converting
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const element = document.querySelector("#how-it-works");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="neo-btn-outline px-7 py-3.5 text-base font-display font-semibold text-[#2C2C2C] cursor-pointer"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right - Hero Illustration */}
            <div className="relative">
              <div className="neo-card-index p-4 bg-white">
                <HeroIllustration className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS SECTION */}
      {/* ============================================ */}
      <section id="how-it-works" className="section-padding bg-[#F5F2ED] border-y-[2.5px] border-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-label text-[#C4705A] mb-3 block">Process</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Precision in Three Steps
            </h2>
            <p className="text-body text-lg text-[#6B6B6B] max-w-md mx-auto">
              From raw document to structured data—designed for clarity at every stage.
            </p>
          </div>

          {/* Process Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connection line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-full w-8 h-[3px] bg-[#2C2C2C] z-0" style={{ transform: "translateX(-16px)" }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-[#2C2C2C]" />
                    </div>
                  )}

                  <div className="neo-card p-8 h-full">
                    {/* Step number badge */}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C4705A] border-[2.5px] border-[#2C2C2C] neo-shadow-sm text-white text-sm font-display font-bold mb-6">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="mb-6">
                      <Icon className="w-16 h-16" />
                    </div>

                    {/* Content */}
                    <h3 className="text-headline text-xl text-[#1A1A1A] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-body text-sm text-[#6B6B6B] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* DEMO SECTION - The Moment of Clarity */}
      {/* ============================================ */}
      <section className="section-padding-lg bg-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="text-label text-[#C4705A] mb-3 block">Demo</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#FAF8F5] mb-4">
              The Moment of Clarity
            </h2>
            <p className="text-body text-lg text-[#A0A0A0] max-w-md mx-auto">
              Watch chaos transform into structure. Before and after, in one view.
            </p>
          </div>

          {/* Demo Window */}
          <div className="window-frame bg-[#FAF8F5] max-w-4xl mx-auto">
            {/* Title bar */}
            <div className="window-titlebar">
              <div className="window-dot window-dot-red" />
              <div className="window-dot window-dot-yellow" />
              <div className="window-dot window-dot-green" />
              <span className="ml-4 text-sm font-display text-[#FAF8F5]/60">
                FileForge Studio
              </span>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2C2C2C] border-t-[2.5px] border-[#2C2C2C]">
              {/* Before - Input */}
              <div className="p-6 lg:p-8 bg-[#F5F2ED]">
                <span className="text-label text-[#6B6B6B] mb-4 block">Input</span>
                <div className="neo-card-flat p-5 bg-white">
                  {/* File preview */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-14 rounded-lg bg-[#C4705A] border-[2px] border-[#2C2C2C] flex items-center justify-center">
                      <span className="text-xs font-display font-bold text-white">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-display font-semibold text-[#1A1A1A]">
                        quarterly_report_2024.pdf
                      </p>
                      <p className="text-xs font-body text-[#6B6B6B]">
                        18 pages • 3.2 MB
                      </p>
                    </div>
                  </div>
                  {/* Messy content preview */}
                  <div className="space-y-2">
                    <div className="h-3 bg-[#EDEAE4] rounded w-full" />
                    <div className="h-3 bg-[#EDEAE4] rounded w-4/5" />
                    <div className="h-3 bg-[#EDEAE4] rounded w-3/5" />
                    <div className="mt-4 h-16 bg-[#EDEAE4] rounded" />
                    <div className="h-3 bg-[#EDEAE4] rounded w-full" />
                    <div className="h-3 bg-[#EDEAE4] rounded w-2/3" />
                  </div>
                </div>
              </div>

              {/* After - Output */}
              <div className="p-6 lg:p-8 bg-white">
                <span className="text-label text-[#4A6B5A] mb-4 block">Output</span>
                <div className="neo-card-flat p-5 bg-[#F5F2ED] font-mono text-xs">
                  <pre className="text-[#2C2C2C] overflow-x-auto">
                    <code>{`{
  "document": {
    "filename": "quarterly_report.pdf",
    "pages": 18,
    "total_tokens": 8420
  },
  "chunks": [
    {
      "type": "heading",
      "text": "Q4 Financial Summary",
      "page": 1,
      "tokens": 128
    },
    {
      "type": "table",
      "rows": 12,
      "columns": ["Quarter", "Revenue"]
    }
  ]
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION */}
      {/* ============================================ */}
      <section id="features" className="section-padding">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-label text-[#C4705A] mb-3 block">Capabilities</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Built for Precision
            </h2>
            <p className="text-body text-lg text-[#6B6B6B] max-w-md mx-auto">
              Every feature designed to produce clean, accurate, LLM-ready output.
            </p>
          </div>

          {/* Feature Grid - 2x3 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="neo-card p-7 group cursor-pointer"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-[#F5F2ED] border-[2px] border-[#2C2C2C] flex items-center justify-center mb-5 group-hover:bg-[#C4705A]/10 transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-headline text-lg text-[#1A1A1A] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-body text-sm text-[#6B6B6B] leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Punch holes decoration */}
                  <div className="flex gap-2 mt-5 pt-5 border-t border-dashed border-[#2C2C2C]/20">
                    <div className="punch-hole" />
                    <div className="punch-hole" />
                    <div className="punch-hole" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECURITY & PRIVACY SECTION */}
      {/* ============================================ */}
      <section className="section-padding bg-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Badge */}
            <div className="flex justify-center lg:justify-start">
              <SecurityBadgeIcon className="w-48 h-48 lg:w-64 lg:h-64" />
            </div>

            {/* Right - Content */}
            <div>
              <span className="text-label text-[#6B9B8A] mb-3 block">Security</span>
              <h2 className="text-headline text-3xl sm:text-4xl text-[#FAF8F5] mb-4">
                Your Data. Your Device.{" "}
                <span className="text-[#6B9B8A]">Always.</span>
              </h2>
              <p className="text-body text-lg text-[#A0A0A0] mb-8 max-w-md">
                Privacy isn't a feature—it's the foundation. Process sensitive documents
                with confidence.
              </p>

              {/* Trust Points Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {trustPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#3A3A3A] border-[2px] border-[#4A4A4A]"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#4A6B5A] flex items-center justify-center flex-shrink-0">
                      <CheckmarkIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-body text-[#FAF8F5]">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS SECTION */}
      {/* ============================================ */}
      <section className="section-padding bg-[#F5F2ED] border-y-[2.5px] border-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-label text-[#C4705A] mb-3 block">Testimonials</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Trusted by Engineers
            </h2>
            <p className="text-body text-lg text-[#6B6B6B] max-w-md mx-auto">
              Teams building the next generation of AI applications.
            </p>
          </div>

          {/* Testimonials - Asymmetric layout */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`neo-card p-7 ${index === 1 ? "md:translate-y-6" : ""}`}
              >
                {/* Quote */}
                <p className="text-body text-base text-[#1A1A1A] leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>

                {/* Perforation line */}
                <div className="perforation mb-6" />

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Monogram initials={testimonial.initials} />
                  <div>
                    <p className="text-sm font-display font-semibold text-[#1A1A1A]">
                      {testimonial.author}
                    </p>
                    <p className="text-xs font-body text-[#6B6B6B]">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING SECTION */}
      {/* ============================================ */}
      <section id="pricing" className="section-padding">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-label text-[#C4705A] mb-3 block">Pricing</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-body text-lg text-[#6B6B6B] max-w-md mx-auto">
              Start free, scale when you're ready. No surprises.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border-[2.5px] ${
                  plan.highlighted
                    ? "border-[#C4705A] bg-white neo-shadow-clay"
                    : "border-[#2C2C2C] bg-white neo-shadow"
                }`}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#C4705A] border-[2px] border-[#2C2C2C] rounded-lg neo-shadow-sm">
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-headline text-xl text-[#1A1A1A] mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-display text-4xl text-[#1A1A1A]">
                      {plan.price}
                    </span>
                    <span className="text-body text-sm text-[#6B6B6B]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-body text-sm text-[#6B6B6B]">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
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

                {/* CTA */}
                <button
                  onClick={() => router.push("/transform")}
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
      <section id="faq" className="section-padding bg-white border-y-[2.5px] border-[#2C2C2C]">
        <div className="max-w-content mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="text-label text-[#C4705A] mb-3 block">FAQ</span>
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-body text-lg text-[#6B6B6B]">
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
      <section className="section-padding">
        <div className="max-w-editorial mx-auto px-6 lg:px-8">
          <div className="neo-card-index p-10 lg:p-16 text-center bg-[#F5F2ED]">
            <h2 className="text-headline text-3xl sm:text-4xl text-[#1A1A1A] mb-4">
              Ready to Transform Your Files?
            </h2>
            <p className="text-body text-lg text-[#6B6B6B] mb-10 max-w-md mx-auto">
              Start converting documents to structured data in minutes. No credit
              card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => router.push("/transform")}
                className="neo-btn bg-[#C4705A] text-white px-8 py-4 text-base font-display font-semibold flex items-center gap-2 cursor-pointer"
              >
                Get Started Free
                <ArrowRightIcon className="w-5 h-5" />
              </button>
              <button className="neo-btn-outline px-8 py-4 text-base font-display font-semibold text-[#2C2C2C] cursor-pointer">
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="border-t-[3px] border-[#2C2C2C]">
        <div className="max-w-editorial mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-3 mb-5 cursor-pointer"
              >
                <LogoMark className="w-9 h-9" />
                <span className="text-xl font-display font-bold text-[#1A1A1A]">
                  FileForge
                </span>
              </button>
              <p className="text-sm font-body text-[#6B6B6B] leading-relaxed">
                Transform any file into LLM-ready structured data with precision,
                privacy, and craft.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-label text-[#1A1A1A] mb-5">Product</h4>
              <div className="space-y-3">
                {["Features", "Pricing", "Changelog", "Roadmap"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm font-body text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-label text-[#1A1A1A] mb-5">Resources</h4>
              <div className="space-y-3">
                {["Documentation", "API Reference", "Examples", "Status"].map(
                  (item) => (
                    <a
                      key={item}
                      href="#"
                      className="block text-sm font-body text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      {item}
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-label text-[#1A1A1A] mb-5">Company</h4>
              <div className="space-y-3">
                {["About", "Contact", "Privacy", "Terms"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm font-body text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t-[2px] border-[#EDEAE4] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-body text-[#6B6B6B]">
              © 2024 FileForge. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Twitter", "GitHub", "Discord"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs font-body text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
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
