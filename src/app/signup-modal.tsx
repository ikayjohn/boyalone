"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getAnalyticsAttribution, getAnalyticsIdentity, trackEvent } from "@/lib/analytics";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export interface SessionInfo {
  id: number;
  city: string;
  cityCode: string;
  country: string;
  date: string;
  venue: string;
  status: string;
  imageUrl: string | null;
  capacity: number | null;
  registrationEnabled: boolean;
  _count: { signups: number };
}

export interface SignupResult {
  uniqueId: string;
  qrCodeData: string;
  fullName: string;
}

const PRESAVE_EMBED_UNLOCK_SECONDS = 12;

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCity: string;
  initialSession?: SessionInfo | null;
  presaveUrl?: string;
}

const BODY_ART_OPTIONS = [
  { value: "", label: "Select one..." },
  { value: "Tattoo", label: "Tattoo" },
  { value: "Piercing", label: "Piercing" },
  { value: "None", label: "None" },
];

export function SignupSuccessView({
  result,
  session,
  sessionCity,
}: {
  result: SignupResult;
  session: SessionInfo | null;
  sessionCity: string;
}) {
  return (
    <div className="px-4 py-8 text-center sm:px-8 sm:py-14">
      <div className="mx-auto mb-8 h-[2px] w-12 bg-[#8B5CF6]" />

      <p className="font-[family-name:var(--font-outfit)] text-xs uppercase tracking-[0.3em] text-[#8B5CF6]">
        You&apos;re In
      </p>
      <p className="mt-4 font-[family-name:var(--font-outfit)] text-sm uppercase tracking-[0.24em] text-[#171411]/45 sm:text-[0.95rem]">
        Spirit Warehouse Session, Lagos
      </p>
      <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl text-[#171411] sm:text-5xl">
        See you there,
      </h3>
      <p className="mt-2 font-[family-name:var(--font-playfair)] text-4xl italic text-[#171411]/80 sm:text-5xl">
        {result.fullName.split(" ")[0]}
      </p>

      <div className="mt-10">
        <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.2em] text-[#171411]/45">
          Your Pass ID
        </p>
        <p className="mt-2 font-[family-name:var(--font-outfit)] text-2xl tracking-[0.15em] text-[#171411] sm:text-3xl">
          {result.uniqueId}
        </p>
      </div>

      <div className="mt-8 inline-block border border-black/[0.08] bg-white p-3 sm:p-4">
        <Image
          src={result.qrCodeData}
          alt="Your entry QR code"
          width={220}
          height={220}
          className="block"
        />
      </div>

      <div className="mx-auto mt-8 max-w-xl border border-black/[0.08] bg-gradient-to-b from-black/[0.03] to-transparent px-5 py-5 text-center sm:px-6">
        <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.22em] text-[#8B5CF6]/80">
          Important
        </p>
        <p className="mt-3 font-[family-name:var(--font-playfair)] text-2xl text-[#171411] sm:text-[1.9rem]">
          Screenshot this pass
        </p>
        <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/65">
          Date and venue details will be sent via email and text before the
          event.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-xl gap-4 border-t border-black/[0.08] pt-8 text-center sm:grid-cols-3">
        <InfoBlock label="City" value={session?.city ?? sessionCity} />
        <InfoBlock label="Date" value={session?.date ?? "To be confirmed"} />
        <InfoBlock label="Venue" value={session?.venue ?? "To be confirmed"} />
      </div>
    </div>
  );
}

export default function SignupModal({
  isOpen,
  onClose,
  sessionCity,
  initialSession = null,
  presaveUrl = DEFAULT_SITE_CONTENT.presaveUrl,
}: SignupModalProps) {
  const [session, setSession] = useState<SessionInfo | null>(initialSession);
  const [loading, setLoading] = useState(initialSession === null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [hasLoaded, setHasLoaded] = useState(initialSession !== null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xUsername, setXUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [bodyArtPreference, setBodyArtPreference] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [presaveStarted, setPresaveStarted] = useState(false);
  const [presaveAcknowledged, setPresaveAcknowledged] = useState(false);
  const [showPresaveEmbed, setShowPresaveEmbed] = useState(false);
  const [embedInteracted, setEmbedInteracted] = useState(false);
  const [embedUnlockCountdown, setEmbedUnlockCountdown] = useState(0);
  const hasTrackedOpenRef = useRef(false);
  const hasTrackedUnlockRef = useRef(false);

  function resetFormState() {
    setError("");
    setResult(null);
    setSubmitting(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setCity("");
    setInstagram("");
    setXUsername("");
    setTiktokUsername("");
    setBodyArtPreference("");
    setAgreedToTerms(false);
    setPresaveStarted(false);
    setPresaveAcknowledged(false);
    setShowPresaveEmbed(false);
    setEmbedInteracted(false);
    setEmbedUnlockCountdown(0);
  }

  function handlePresaveClick() {
    trackEvent("presave_click");
    setPresaveStarted(true);
    setShowPresaveEmbed(true);
    setEmbedInteracted(false);
  }

  useEffect(() => {
    if (!isOpen) {
      hasTrackedOpenRef.current = false;
      hasTrackedUnlockRef.current = false;
      return;
    }

    if (!hasTrackedOpenRef.current) {
      trackEvent("registration_modal_open");
      hasTrackedOpenRef.current = true;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (
      !isOpen ||
      !presaveStarted ||
      !presaveAcknowledged ||
      hasTrackedUnlockRef.current
    ) {
      return;
    }

    trackEvent("registration_form_unlock");
    hasTrackedUnlockRef.current = true;
  }, [isOpen, presaveAcknowledged, presaveStarted]);

  useEffect(() => {
    if (!embedInteracted || embedUnlockCountdown <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setEmbedUnlockCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [embedInteracted, embedUnlockCountdown]);

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setHasLoaded(true);
      setLoading(false);
    }
  }, [initialSession]);

  useEffect(() => {
    if (!isOpen || hasLoaded) {
      return;
    }

    let cancelled = false;

    async function fetchSession() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/sessions/${sessionCity}`);
        if (!res.ok) {
          throw new Error("Session not found");
        }

        const data = await res.json();
        if (!cancelled) {
          setSession(data.session);
          setHasLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setError("Session details are unavailable right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, [hasLoaded, isOpen, sessionCity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const identity = getAnalyticsIdentity();
      const attribution = getAnalyticsAttribution();
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCity: session?.city,
          fullName,
          email,
          phone,
          city,
          instagram: instagram.replace(/^@/, ""),
          xUsername: xUsername.replace(/^@/, ""),
          tiktokUsername: tiktokUsername.replace(/^@/, ""),
          bodyArtPreference: bodyArtPreference || null,
          agreedToTerms,
          analyticsVisitorId: identity.visitorId,
          analyticsSessionId: identity.sessionId,
          analyticsAttribution: attribution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data.signup);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    resetFormState();
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  const isFull =
    session !== null &&
    session.capacity !== null &&
    session._count.signups >= session.capacity;
  const registrationClosed = session !== null && !session.registrationEnabled;
  const showCapacity = session !== null && session.capacity !== null;
  const capacity = showCapacity ? session.capacity : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={handleClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-black/10 bg-[#F6F1E8] shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:max-h-[90vh] sm:rounded-none">
        <div className="flex items-center justify-end px-4 py-3 sm:px-8 sm:py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-[#171411]/65 transition-colors hover:text-[#8B5CF6]"
            aria-label="Close registration modal"
          >
            <span className="text-[2rem] leading-none">&times;</span>
          </button>
        </div>

        <div className="overflow-y-auto">
          {!session && !loading ? (
            <div className="px-4 py-12 text-center sm:px-8 sm:py-16">
              <h3 className="font-[family-name:var(--font-playfair)] text-3xl text-[#171411]">
                Session Unavailable
              </h3>
              <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/60">
                {error || "We couldn&apos;t load the Lagos registration details."}
              </p>
            </div>
          ) : result ? (
            <SignupSuccessView
              result={result}
              session={session}
              sessionCity={sessionCity}
            />
          ) : (
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-black/[0.08] px-4 py-6 sm:px-8 sm:py-8 lg:border-b-0">
                <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6]/70">
                  {session?.status ?? "Loading Session"}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-[2.2rem] leading-none text-[#171411] sm:mt-4 sm:text-5xl">
                  {session?.city ?? "Lagos"}
                </h3>

                <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                  <InfoBlock
                    align="left"
                    label="Date"
                    value={session?.date ?? "Loading..."}
                  />
                  <InfoBlock
                    align="left"
                    label="Venue"
                    value={session?.venue ?? "Loading..."}
                  />
                </div>

                {showCapacity && capacity !== null && (
                  <div className="mt-8 sm:mt-10">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.2em] text-[#171411]/45">
                        Spots
                      </span>
                      <span className="font-[family-name:var(--font-outfit)] text-xs text-[#171411]/55">
                        {session._count.signups} / {capacity}
                      </span>
                    </div>
                    <div className="h-[2px] overflow-hidden bg-black/[0.08]">
                      <div
                        className="h-full bg-[#8B5CF6] transition-all duration-500"
                        style={{
                          width: `${Math.min((session._count.signups / capacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {!isFull && !registrationClosed ? (
                  <>
                    <div className="mt-8 border-t border-black/[0.08] pt-8 sm:mt-10">
                      <h3 className="font-[family-name:var(--font-playfair)] text-2xl leading-snug text-[#171411]">
                        To be invited, you must pre-save{" "}
                        <span className="text-[#171411]/80">Clarity of Mind.</span>
                      </h3>
                    </div>

                    <div className="mt-6">
                      <p className="font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/70">
                        This is intimate and exclusive. A limited number of
                        spirits will be invited. If you receive one, you&apos;re
                        meant to be there.
                      </p>
                      <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/70">
                        Hit the pre-save link below and we&apos;ll unlock the
                        registration form right after.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="px-4 py-6 sm:px-8 sm:py-8">
                {registrationClosed ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center sm:min-h-[420px]">
                    <h3 className="font-[family-name:var(--font-playfair)] text-3xl text-[#171411]">
                      Registration is closed
                    </h3>
                    <p className="mt-4 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/60">
                      This session is not accepting registrations right now. Check back when the team reopens access.
                    </p>
                  </div>
                ) : isFull ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center sm:min-h-[420px]">
                    <h3 className="font-[family-name:var(--font-playfair)] text-3xl text-[#171411]">
                      This session is full
                    </h3>
                    <p className="mt-4 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/60">
                      All spots have been claimed. Check back for future sessions.
                    </p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3">
                        <p className="font-[family-name:var(--font-outfit)] text-sm text-red-700">
                          {error}
                        </p>
                      </div>
                    )}

                    {loading ? (
                      <div className="mt-6 flex items-center gap-3 border border-black/[0.08] bg-white/60 px-4 py-3">
                        <div className="h-4 w-4 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin" />
                        <p className="font-[family-name:var(--font-outfit)] text-sm text-[#171411]/55">
                          Getting the session details ready...
                        </p>
                      </div>
                    ) : null}

                    {!presaveStarted ? (
                      <div className="mt-3 flex flex-col gap-3 sm:mt-4">
                        <button
                          type="button"
                          onClick={handlePresaveClick}
                          className="w-full cursor-pointer bg-[#8B5CF6] px-6 py-4 font-[family-name:var(--font-outfit)] text-sm font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-all duration-300 hover:bg-[#7C3AED] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] sm:px-8 sm:tracking-[0.18em]"
                        >
                          Pre-Save To Continue
                        </button>
                      </div>
                    ) : null}

                    {presaveStarted ? (
                      presaveAcknowledged && session ? (
                        <form
                          onSubmit={handleSubmit}
                          className="mt-8 space-y-5 border-t border-black/[0.08] pt-8 sm:space-y-6"
                        >
                          <div className="mb-1">
                            <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.18em] text-[#8B5CF6]/80">
                              You&apos;re Good To Go
                            </p>
                          </div>

                          <Field
                            id="fullName"
                            label="Full Name"
                            required
                            value={fullName}
                            onChange={setFullName}
                            placeholder="Your full name"
                          />
                          <Field
                            id="email"
                            label="Email"
                            type="email"
                            required
                            value={email}
                            onChange={setEmail}
                            placeholder="you@email.com"
                          />
                          <Field
                            id="phone"
                            label="Phone Number"
                            type="tel"
                            required
                            value={phone}
                            onChange={setPhone}
                            placeholder="+234 800 000 0000"
                          />
                          <Field
                            id="city"
                            label="Your City"
                            required
                            value={city}
                            onChange={setCity}
                            placeholder="Where are you based?"
                          />

                          <div>
                            <label
                              htmlFor="instagram"
                              className="mb-3 block font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.15em] text-[#171411]/45"
                            >
                              Instagram Handle
                              <span className="ml-1 text-[#8B5CF6]">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-base text-[#171411]/35">
                                @
                              </span>
                              <input
                                id="instagram"
                                type="text"
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                required
                                placeholder="yourhandle"
                                className="w-full border-b border-black/[0.12] bg-transparent py-3 pl-5 pr-0 font-[family-name:var(--font-outfit)] text-base text-[#171411] placeholder:text-[#171411]/25 focus:border-[#8B5CF6] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="xUsername"
                              className="mb-3 block font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.15em] text-[#171411]/45"
                            >
                              X Username
                              <span className="ml-1 text-[#8B5CF6]">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-base text-[#171411]/35">
                                @
                              </span>
                              <input
                                id="xUsername"
                                type="text"
                                value={xUsername}
                                onChange={(e) => setXUsername(e.target.value)}
                                required
                                placeholder="yourusername"
                                className="w-full border-b border-black/[0.12] bg-transparent py-3 pl-5 pr-0 font-[family-name:var(--font-outfit)] text-base text-[#171411] placeholder:text-[#171411]/25 focus:border-[#8B5CF6] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="tiktokUsername"
                              className="mb-3 block font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.15em] text-[#171411]/45"
                            >
                              TikTok Username
                              <span className="ml-1 text-[#8B5CF6]">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-base text-[#171411]/35">
                                @
                              </span>
                              <input
                                id="tiktokUsername"
                                type="text"
                                value={tiktokUsername}
                                onChange={(e) => setTiktokUsername(e.target.value)}
                                required
                                placeholder="yourusername"
                                className="w-full border-b border-black/[0.12] bg-transparent py-3 pl-5 pr-0 font-[family-name:var(--font-outfit)] text-base text-[#171411] placeholder:text-[#171411]/25 focus:border-[#8B5CF6] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="bodyArtPreference"
                              className="mb-3 block font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.15em] text-[#171411]/45"
                            >
                              What are you coming for?
                              <span className="ml-1 text-[#8B5CF6]">*</span>
                            </label>
                            <select
                              id="bodyArtPreference"
                              value={bodyArtPreference}
                              onChange={(e) => setBodyArtPreference(e.target.value)}
                              required
                              className="w-full appearance-none border-b border-black/[0.12] bg-transparent py-3 pr-8 font-[family-name:var(--font-outfit)] text-base text-[#171411] focus:border-[#8B5CF6] focus:outline-none"
                            >
                              {BODY_ART_OPTIONS.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                  className="bg-[#F6F1E8] text-[#171411]"
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="flex cursor-pointer items-start gap-3 pt-1 sm:gap-4 sm:pt-2">
                            <div className="relative mt-0.5 shrink-0">
                              <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                                className="peer sr-only"
                              />
                              <div className="h-5 w-5 border border-black/[0.16] transition-colors peer-checked:border-[#8B5CF6] peer-checked:bg-[#8B5CF6]" />
                              <svg
                                className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
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
                            <span className="font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#171411]/65">
                              I&apos;m happy for my details to be used for this
                              event and I agree to the event terms.
                            </span>
                          </label>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full cursor-pointer bg-[#8B5CF6] px-6 py-4 font-[family-name:var(--font-outfit)] text-sm font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-all duration-300 hover:bg-[#7C3AED] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-8 sm:tracking-[0.18em]"
                          >
                            {submitting ? "Saving Your Spot..." : "Join The List"}
                          </button>
                        </form>
                      ) : (
                        <div className="mt-2">
                          {showPresaveEmbed ? (
                            <div className="relative overflow-hidden border border-black/[0.08] bg-white">
                              <div className="border-b border-black/[0.08] bg-black/[0.02] px-4 py-3">
                                <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.16em] text-[#171411]/45">
                                  Pre-Save Clarity of Mind
                                </p>
                              </div>
                              {!embedInteracted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEmbedInteracted(true);
                                    setEmbedUnlockCountdown(
                                      PRESAVE_EMBED_UNLOCK_SECONDS
                                    );
                                  }}
                                  aria-label="Interact with pre-save panel"
                                  className="absolute inset-x-0 top-[49px] z-10 h-[420px] w-full cursor-pointer bg-transparent"
                                />
                              ) : null}
                              <iframe
                                src={presaveUrl}
                                title="Pre-save Clarity of Mind"
                                className="h-[420px] w-full bg-white"
                              />
                            </div>
                          ) : null}
                          {!embedInteracted || embedUnlockCountdown > 0 ? (
                            <p className="mt-4 text-center font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.08em] text-[#171411]/60">
                              PRE-SAVE TO UNLOCK REGISTRATION
                            </p>
                          ) : null}
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <button
                              type="button"
                              onClick={() => setPresaveAcknowledged(true)}
                              disabled={
                                loading || !embedInteracted || embedUnlockCountdown > 0
                              }
                              className="w-full cursor-pointer bg-[#8B5CF6] px-5 py-4 font-[family-name:var(--font-outfit)] text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-colors hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {embedUnlockCountdown > 0
                                ? `Continue to Registration in ${embedUnlockCountdown}s`
                                : "Continue to Registration"}
                            </button>
                          </div>
                        </div>
                      )
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  align = "center",
}: {
  label: string;
  value: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "left" ? "text-left" : "text-center"}>
      <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.2em] text-[#171411]/45">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-outfit)] text-sm text-[#171411]">
        {value}
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.15em] text-[#171411]/45"
      >
        {label}
        {required && <span className="ml-1 text-[#8B5CF6]">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border-b border-black/[0.12] bg-transparent py-3 font-[family-name:var(--font-outfit)] text-base text-[#171411] placeholder:text-[#171411]/25 focus:border-[#8B5CF6] focus:outline-none"
      />
    </div>
  );
}
