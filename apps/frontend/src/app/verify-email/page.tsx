"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyEmail, AuthError } from "@/lib/auth-api";

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

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 10L8 14L16 6" strokeLinecap="round" strokeLinejoin="round" />
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

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 6L14 14M14 6L6 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setError("Invalid verification link. Please check your email for the correct link.");
        return;
      }

      try {
        await verifyEmail({ token });
        setStatus("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        setStatus("error");
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError("Failed to verify email. Please try again or request a new verification link.");
        }
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-12">
        <LogoMark className="w-10 h-10" />
        <span className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">
          FileForge
        </span>
      </Link>

      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#EDEAE4] mx-auto mb-6 flex items-center justify-center">
              <LoadingSpinner className="w-8 h-8 text-[#C4705A]" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1A1A1A] mb-4">
              Verifying your email...
            </h1>
            <p className="text-base font-body text-[#6B6B6B]">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#4A6B5A] mx-auto mb-6 flex items-center justify-center">
              <CheckmarkIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1A1A1A] mb-4">
              Email verified!
            </h1>
            <p className="text-base font-body text-[#6B6B6B] mb-6">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <p className="text-sm font-body text-[#A0A0A0] mb-6">
              Redirecting to login...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 neo-btn bg-[#C4705A] text-white font-display font-semibold"
            >
              Sign in now
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#B54A4A] mx-auto mb-6 flex items-center justify-center">
              <ErrorIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1A1A1A] mb-4">
              Verification failed
            </h1>
            <p className="text-base font-body text-[#6B6B6B] mb-6">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 neo-btn-outline font-display font-semibold text-[#2C2C2C]"
              >
                Back to login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 neo-btn bg-[#C4705A] text-white font-display font-semibold"
              >
                Sign up again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
