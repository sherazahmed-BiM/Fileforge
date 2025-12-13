"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyOTP, resendVerification, AuthError } from "@/lib/auth-api";

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

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newOtp.every(d => d !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyOTP({ email, code: otpCode });
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Verification failed. Please try again.");
      }
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    setError(null);

    try {
      await resendVerification({ email });
      setResendMessage("A new verification code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Failed to resend code. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <LogoMark className="w-10 h-10" />
          <span className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">
            FileForge
          </span>
        </Link>

        <div className="max-w-md w-full text-center">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-12">
        <LogoMark className="w-10 h-10" />
        <span className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">
          FileForge
        </span>
      </Link>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#EDEAE4] mx-auto mb-6 flex items-center justify-center">
            <MailIcon className="w-8 h-8 text-[#C4705A]" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[#1A1A1A] mb-2">
            Check your email
          </h1>
          <p className="text-base font-body text-[#6B6B6B]">
            We sent a 6-digit verification code to
          </p>
          <p className="text-base font-display font-semibold text-[#1A1A1A]">
            {email || "your email"}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-display font-semibold text-[#1A1A1A] mb-4 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-display font-bold rounded-xl border-[2.5px] border-[#2C2C2C] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C4705A] focus:ring-offset-2 transition-all disabled:opacity-50"
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border-[2px] border-[#B54A4A]">
            <p className="text-sm font-body text-[#B54A4A] text-center">{error}</p>
          </div>
        )}

        {/* Success Message for Resend */}
        {resendMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border-[2px] border-[#4A6B5A]">
            <p className="text-sm font-body text-[#4A6B5A] text-center">{resendMessage}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || otp.some(d => d === "")}
          className="w-full neo-btn bg-[#C4705A] text-white py-3.5 flex items-center justify-center gap-2 font-display font-semibold disabled:opacity-50 cursor-pointer mb-4"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </button>

        {/* Resend Link */}
        <div className="text-center">
          <p className="text-sm font-body text-[#6B6B6B] mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm font-display font-semibold text-[#C4705A] hover:text-[#A85A4A] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </div>

        {/* Back to Signup */}
        <div className="mt-8 text-center">
          <Link
            href="/signup"
            className="text-sm font-body text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          >
            &larr; Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
