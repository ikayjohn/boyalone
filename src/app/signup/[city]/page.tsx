"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SessionInfo {
  id: number;
  city: string;
  cityCode: string;
  country: string;
  date: string;
  venue: string;
  status: string;
  imageUrl: string | null;
  capacity: number | null;
  _count: { signups: number };
}

interface SignupResult {
  uniqueId: string;
  qrCodeData: string;
  fullName: string;
}

const BODY_ART_OPTIONS = [
  { value: "", label: "Select one..." },
  { value: "Tattoo", label: "Tattoo" },
  { value: "Piercing", label: "Piercing" },
  { value: "None", label: "None" },
];

export default function SignupPage() {
  const params = useParams();
  const city = params.city as string;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userCity, setUserCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xUsername, setXUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [bodyArtPreference, setBodyArtPreference] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${city}`);
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setSession(data.session);
      } catch {
        setError("Session not found. Please check the URL and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [city]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCity: session?.city,
          fullName,
          email,
          phone,
          city: userCity,
          instagram: instagram.replace(/^@/, ""),
          xUsername: xUsername.replace(/^@/, ""),
          tiktokUsername: tiktokUsername.replace(/^@/, ""),
          bodyArtPreference: bodyArtPreference || null,
          agreedToTerms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      setResult(data.signup);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state (no session)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-white mb-4">
            Session Not Found
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[#999] mb-8">
            {error || "We couldn\u2019t find a session for this city."}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#8B5CF6] text-white text-sm font-medium tracking-wide uppercase rounded-sm hover:bg-[#7C3AED] transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Success / Confirmation state
  if (result) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Purple accent line */}
          <div className="w-12 h-[2px] bg-[#8B5CF6] mx-auto mb-10" />

          <p className="font-[family-name:var(--font-body)] text-[#8B5CF6] text-xs tracking-[0.3em] uppercase mb-4">
            You&apos;re in
          </p>

          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-semibold text-white mb-3">
            See you there,
          </h1>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-semibold text-white italic mb-10">
            {result.fullName.split(" ")[0]}
          </h2>

          {/* Unique ID */}
          <div className="mb-10">
            <p className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.2em] uppercase mb-2">
              Your Pass ID
            </p>
            <p className="font-[family-name:var(--font-body)] text-white text-2xl md:text-3xl font-light tracking-[0.15em]">
              {result.uniqueId}
            </p>
          </div>

          {/* QR Code */}
          <div className="inline-block p-5 border border-[#1A1A1A] rounded-sm mb-8">
            <Image
              src={result.qrCodeData}
              alt="Your entry QR code"
              width={220}
              height={220}
              className="block"
            />
          </div>

          {/* CTA message */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm px-6 py-5 mb-10">
            <p className="font-[family-name:var(--font-body)] text-white text-sm leading-relaxed">
              Screenshot this page &mdash; you&apos;ll need your QR code and
              Pass ID at the door.
            </p>
          </div>

          {/* Session details reminder */}
          <div className="text-left border-t border-[#1A1A1A] pt-8 mb-10">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-[family-name:var(--font-body)] text-[#666] text-[10px] tracking-[0.2em] uppercase mb-1">
                  City
                </p>
                <p className="font-[family-name:var(--font-body)] text-white text-sm">
                  {session.city}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-body)] text-[#666] text-[10px] tracking-[0.2em] uppercase mb-1">
                  Date
                </p>
                <p className="font-[family-name:var(--font-body)] text-white text-sm">
                  {session.date}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-body)] text-[#666] text-[10px] tracking-[0.2em] uppercase mb-1">
                  Venue
                </p>
                <p className="font-[family-name:var(--font-body)] text-white text-sm">
                  {session.venue}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.2em] uppercase hover:text-[#8B5CF6] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Registration form
  const isFull =
    session.capacity !== null &&
    session._count.signups >= session.capacity;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header section */}
      <div className="border-b border-[#1A1A1A]">
        <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
          <Link
            href="/"
            className="inline-block font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.2em] uppercase mb-10 hover:text-[#8B5CF6] transition-colors"
          >
            &larr; Back
          </Link>

          <p className="font-[family-name:var(--font-body)] text-[#8B5CF6] text-xs tracking-[0.3em] uppercase mb-4">
            Listening Session
          </p>

          <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-6xl font-semibold text-white mb-6">
            {session.city}
          </h1>

          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <span className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.15em] uppercase">
                Date
              </span>
              <p className="font-[family-name:var(--font-body)] text-white text-sm mt-1">
                {session.date}
              </p>
            </div>
            <div>
              <span className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.15em] uppercase">
                Venue
              </span>
              <p className="font-[family-name:var(--font-body)] text-white text-sm mt-1">
                {session.venue}
              </p>
            </div>
            <div>
              <span className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.15em] uppercase">
                Country
              </span>
              <p className="font-[family-name:var(--font-body)] text-white text-sm mt-1">
                {session.country}
              </p>
            </div>
          </div>

          {session.capacity && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-[family-name:var(--font-body)] text-[#666] text-xs tracking-[0.15em] uppercase">
                  Spots
                </span>
                <span className="font-[family-name:var(--font-body)] text-[#999] text-xs">
                  {session._count.signups} / {session.capacity}
                </span>
              </div>
              <div className="h-[2px] bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B5CF6] transition-all duration-500"
                  style={{
                    width: `${Math.min((session._count.signups / session.capacity) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form section */}
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-20">
        {isFull ? (
          <div className="text-center py-20">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-white mb-4">
              This session is full
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[#999] mb-8">
              All spots have been claimed. Check back for future sessions.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#8B5CF6] text-white text-sm font-medium tracking-wide uppercase rounded-sm hover:bg-[#7C3AED] transition-colors"
            >
              View All Sessions
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white mb-2">
              Register
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[#666] text-sm mb-12">
              Secure your spot at the listening session.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-5 py-4 mb-8">
                <p className="font-[family-name:var(--font-body)] text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  Full Name <span className="text-[#8B5CF6]">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 px-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  Email <span className="text-[#8B5CF6]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 px-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                  placeholder="you@email.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  Phone Number <span className="text-[#8B5CF6]">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 px-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                  placeholder="+234 800 000 0000"
                />
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="userCity"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  Your City <span className="text-[#8B5CF6]">*</span>
                </label>
                <input
                  id="userCity"
                  type="text"
                  required
                  value={userCity}
                  onChange={(e) => setUserCity(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 px-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                  placeholder="Where are you based?"
                />
              </div>

              {/* Instagram */}
              <div>
                <label
                  htmlFor="instagram"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-[family-name:var(--font-body)] text-[#666] text-base">
                    @
                  </span>
                  <input
                    id="instagram"
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 pl-5 pr-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                    placeholder="yourhandle"
                  />
                </div>
              </div>

              {/* X Username */}
              <div>
                <label
                  htmlFor="xUsername"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  X Username
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-[family-name:var(--font-body)] text-[#666] text-base">
                    @
                  </span>
                  <input
                    id="xUsername"
                    type="text"
                    value={xUsername}
                    onChange={(e) => setXUsername(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 pl-5 pr-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                    placeholder="yourusername"
                  />
                </div>
              </div>

              {/* TikTok Username */}
              <div>
                <label
                  htmlFor="tiktokUsername"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  TikTok Username
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-[family-name:var(--font-body)] text-[#666] text-base">
                    @
                  </span>
                  <input
                    id="tiktokUsername"
                    type="text"
                    value={tiktokUsername}
                    onChange={(e) => setTiktokUsername(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 pl-5 pr-0 font-[family-name:var(--font-body)] placeholder:text-[#333] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                    placeholder="yourusername"
                  />
                </div>
              </div>

              {/* Body Art Preference */}
              <div>
                <label
                  htmlFor="bodyArtPreference"
                  className="block font-[family-name:var(--font-body)] text-[#999] text-xs tracking-[0.15em] uppercase mb-3"
                >
                  What are you coming for?
                </label>
                <select
                  id="bodyArtPreference"
                  value={bodyArtPreference}
                  onChange={(e) => setBodyArtPreference(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-white text-base py-3 px-0 font-[family-name:var(--font-body)] focus:border-[#8B5CF6] focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {BODY_ART_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-[#0A0A0A] text-white"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Terms */}
              <div className="pt-4">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="sr-only peer"
                      required
                    />
                    <div className="w-5 h-5 border border-[#2A2A2A] rounded-sm peer-checked:bg-[#8B5CF6] peer-checked:border-[#8B5CF6] transition-colors group-hover:border-[#8B5CF6]/50" />
                    <svg
                      className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="font-[family-name:var(--font-body)] text-[#999] text-sm leading-relaxed">
                    I agree to the terms and conditions, including the use of my
                    data for this event.{" "}
                    <span className="text-[#8B5CF6]">*</span>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#8B5CF6] text-white font-[family-name:var(--font-body)] text-sm font-medium tracking-[0.15em] uppercase py-4 px-8 rounded-sm hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    "Secure My Spot"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
