"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthError } from "@/lib/auth-api";

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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
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

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (!isPasswordStrong) {
      setError("Please create a stronger password");
      return;
    }

    setIsLoading(true);

    try {
      await signup({ email, password, name: name || undefined });
      // Redirect to OTP verification page immediately
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Social login placeholder - coming soon
  const handleSocialSignup = (provider: string) => {
    setError(`${provider} signup coming soon!`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-[#2C2C2C] items-center justify-center p-12">
        <div className="max-w-md">
          {/* Feature List */}
          <h2 className="text-2xl font-display font-bold text-[#FAF8F5] mb-8">
            Start transforming documents in minutes
          </h2>

          <div className="space-y-6">
            {[
              {
                title: "100 free pages per month",
                description: "Get started without a credit card",
              },
              {
                title: "30+ supported file formats",
                description: "PDF, DOCX, XLSX, images, and more",
              },
              {
                title: "Semantic chunking",
                description: "Intelligent splitting for better AI results",
              },
              {
                title: "Privacy-first processing",
                description: "Your files are never stored or shared",
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#4A6B5A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckmarkIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-[#FAF8F5]">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-body text-[#A0A0A0]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-12 p-6 rounded-xl bg-[#3A3A3A] border-[2px] border-[#4A4A4A]">
            <p className="text-base font-body text-[#FAF8F5] italic mb-4">
              "FileForge replaced three tools in our document pipeline. The JSON output is exactly what our RAG system needs."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C4705A] border-[2px] border-[#2C2C2C] flex items-center justify-center">
                <span className="text-sm font-display font-bold text-white">SC</span>
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-[#FAF8F5]">Sarah Chen</p>
                <p className="text-xs font-body text-[#A0A0A0]">ML Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <LogoMark className="w-10 h-10" />
            <span className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">
              FileForge
            </span>
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] text-center mb-2">
            Create your account
          </h1>
          <p className="text-base font-body text-[#6B6B6B] text-center mb-8">
            Start converting documents for free
          </p>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialSignup("google")}
              disabled={isLoading}
              className="w-full neo-btn-outline py-3 flex items-center justify-center gap-3 font-display font-semibold text-[#2C2C2C] disabled:opacity-50 cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleSocialSignup("github")}
              disabled={isLoading}
              className="w-full neo-btn-outline py-3 flex items-center justify-center gap-3 font-display font-semibold text-[#2C2C2C] disabled:opacity-50 cursor-pointer"
            >
              <GitHubIcon className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-[2px] border-[#EDEAE4]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#FAF8F5] font-body text-[#6B6B6B]">
                or continue with email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#C4705A] focus:ring-offset-2 transition-all"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#C4705A] focus:ring-offset-2 transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-display font-semibold text-[#1A1A1A] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-[2.5px] border-[#2C2C2C] bg-white font-body text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#C4705A] focus:ring-offset-2 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicators */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${hasMinLength ? "bg-[#4A6B5A]" : "bg-[#EDEAE4]"}`}>
                      {hasMinLength && <CheckmarkIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs font-body ${hasMinLength ? "text-[#4A6B5A]" : "text-[#6B6B6B]"}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${hasUppercase ? "bg-[#4A6B5A]" : "bg-[#EDEAE4]"}`}>
                      {hasUppercase && <CheckmarkIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs font-body ${hasUppercase ? "text-[#4A6B5A]" : "text-[#6B6B6B]"}`}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${hasNumber ? "bg-[#4A6B5A]" : "bg-[#EDEAE4]"}`}>
                      {hasNumber && <CheckmarkIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs font-body ${hasNumber ? "text-[#4A6B5A]" : "text-[#6B6B6B]"}`}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`w-5 h-5 rounded border-[2px] flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                  agreedToTerms
                    ? "bg-[#C4705A] border-[#C4705A]"
                    : "bg-white border-[#2C2C2C]"
                }`}
              >
                {agreedToTerms && <CheckmarkIcon className="w-3 h-3 text-white" />}
              </button>
              <span className="text-sm font-body text-[#6B6B6B]">
                I agree to the{" "}
                <Link href="/terms" className="text-[#C4705A] hover:text-[#A85A4A] transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#C4705A] hover:text-[#A85A4A] transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border-[2px] border-[#B54A4A]">
                <p className="text-sm font-body text-[#B54A4A]">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full neo-btn bg-[#C4705A] text-white py-3.5 flex items-center justify-center gap-2 font-display font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm font-body text-[#6B6B6B]">
            Already have an account?{" "}
            <Link href="/login" className="font-display font-semibold text-[#C4705A] hover:text-[#A85A4A] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
