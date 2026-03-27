"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { trackEvent, trackOncePerTab } from "@/lib/analytics";
import { DEFAULT_SITE_CONTENT, type SiteContentPayload } from "@/lib/site-content";
import SignupModal, { type SessionInfo } from "./signup-modal";

const pastSessions = [
  {
    city: "London",
    image: "/london.jpeg",
  },
  {
    city: "Paris",
    image: "/paris1.jpeg",
    monochrome: true,
  },
  {
    city: "Amsterdam",
    image: "/amsterdam.JPEG",
    darken: true,
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/OfficialOmahLay",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/Omah_Lay",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/omah_lay/",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCSUVM9Ygr6AI5Eje5BnFhtw",
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/5yOvAmpIR7hVxiS6Ls5DPO?si=PkzWcbzMTKCb-OEIhyHbRA",
  },
  {
    label: "SoundCloud",
    href: "https://soundcloud.com/omah_lay",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@omah_lay",
  },
];

export default function Home() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [lagosSession, setLagosSession] = useState<SessionInfo | null>(null);
  const [siteContent, setSiteContent] =
    useState<SiteContentPayload>(DEFAULT_SITE_CONTENT);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    trackOncePerTab("homepage_view", "homepage_view", { path: "/" });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal, .reveal-left").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preloadContent() {
      try {
        const res = await fetch("/api/content");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (!cancelled && data.content) {
          setSiteContent(data.content);
        }
      } catch {
        // Keep defaults when content settings are unavailable.
      }
    }

    async function preloadSession() {
      try {
        const res = await fetch("/api/sessions/lagos");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setLagosSession(data.session);
        }
      } catch {
        // Keep the modal fallback fetch path intact if the preload misses.
      }
    }

    preloadContent();
    preloadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const video = heroVideoRef.current;

    if (!video) {
      return;
    }

    const attemptPlayback = () => {
      video.defaultMuted = true;
      video.muted = true;

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Mobile browsers can defer autoplay until the media is ready or visible.
        });
      }
    };

    attemptPlayback();

    video.addEventListener("loadedmetadata", attemptPlayback);
    video.addEventListener("canplay", attemptPlayback);
    document.addEventListener("visibilitychange", attemptPlayback);

    return () => {
      video.removeEventListener("loadedmetadata", attemptPlayback);
      video.removeEventListener("canplay", attemptPlayback);
      document.removeEventListener("visibilitychange", attemptPlayback);
    };
  }, []);

  return (
    <div className="grain relative min-h-screen bg-[#0A0A0A]">
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        sessionCity="lagos"
        initialSession={lagosSession}
        presaveUrl={siteContent.presaveUrl}
      />

      {/* ─── NAVIGATION ─── */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-4 sm:px-10 sm:py-5 lg:px-16 bg-transparent border-b border-transparent">
        <Image
          src="/logo.png"
          alt="Omah Lay"
          width={144}
          height={40}
          loading="eager"
          className="h-7 w-auto animate-fade-in brightness-0 invert sm:h-8"
        />
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative isolate flex min-h-screen flex-col justify-end overflow-hidden px-4 pb-12 pt-24 sm:px-10 sm:pb-24 sm:pt-32 lg:px-16">
        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={siteContent.heroVideoUrl} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-[#050505]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.2),transparent_35%),linear-gradient(180deg,rgba(10,10,10,0.18)_0%,rgba(10,10,10,0.52)_58%,rgba(10,10,10,0.88)_100%)]" />
        <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-gradient-to-bl from-[#8B5CF6]/[0.06] to-transparent pointer-events-none" />

        {/* Main heading — offset left, dramatic size */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-[family-name:var(--font-playfair)] text-[clamp(2.9rem,13vw,7rem)] font-medium leading-[0.88] tracking-[-0.03em] text-[#F5F0EB] animate-slide-left delay-200">
            {siteContent.heroLine1}
            <br />
            {siteContent.heroLine2}
            <br />
            <span className="italic text-[#F5F0EB]/70">
              {siteContent.heroLine3}
            </span>
            <br />
            <span className="text-[#8B5CF6]/90">{siteContent.heroAccent}</span>
          </h1>

          {/* Animated accent line */}
          <div className="mt-5 h-[1px] w-24 bg-[#8B5CF6]/40 animate-line-expand delay-700 sm:mt-8 sm:w-48" />

          <p className="mt-5 max-w-[19rem] font-[family-name:var(--font-outfit)] text-sm font-light leading-relaxed text-[#F5F0EB]/58 animate-fade-in-up delay-800 sm:mt-8 sm:max-w-md sm:text-base sm:text-[#F5F0EB]/50">
            {siteContent.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="mt-7 flex w-full flex-col items-stretch gap-3 animate-fade-in-up delay-1000 sm:mt-10 sm:w-auto sm:flex-row sm:items-start sm:gap-4">
            <button
              type="button"
              onClick={() => {
                trackEvent("register_click", { path: "/" });
                setShowSignupModal(true);
              }}
              className="group relative inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-3 px-6 py-4 text-center bg-[#8B5CF6] text-[#0A0A0A] font-[family-name:var(--font-outfit)] text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors duration-300 hover:bg-[#F5F0EB] sm:min-h-0 sm:w-auto sm:px-8 sm:text-xs sm:tracking-[0.25em]"
            >
              Register Now
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 hidden animate-fade-in delay-1500 sm:right-10 sm:flex lg:right-16">
          <div className="flex flex-col items-center gap-2">
            <span className="font-[family-name:var(--font-outfit)] text-[9px] tracking-[0.3em] uppercase text-white/20 [writing-mode:vertical-rl]">
              Scroll
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* ─── SCHEDULE ─── */}
      <section className="relative px-4 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal mb-10 border-t border-white/[0.08] pt-6 sm:mb-16 sm:pt-8" />

          <div className="relative pl-8 sm:pl-10">
            {/* Vertical timeline line — pinned to the dot column */}
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-[#8B5CF6]/50 via-white/[0.08] to-transparent sm:left-[9px]" />

            {[
              {
                time: "7:00 PM",
                title: "Tattoo Sessions",
                detail: "Get matching tattoos with Omah Lay",
              },
              {
                time: "8:30 PM",
                title: "Body Piercing",
              },
              {
                time: "9:15 PM",
                title: "Q&A",
              },
              {
                time: "10:00 PM",
                title: "First Album Preview",
              },
              {
                time: "Midnight",
                title: "Party / Official Album Release",
              },
            ].map((item, index) => (
              <div
                key={`${item.time}-${item.title}`}
                className="reveal relative border-b border-white/[0.08] py-6 last:border-b-0 sm:py-10"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                {/* Timeline dot — centered on the vertical line */}
                <div className="absolute left-[-25px] top-[2.1rem] h-[14px] w-[14px] -translate-x-1/2 rounded-full border border-[#8B5CF6]/70 bg-[#0A0A0A] shadow-[0_0_18px_rgba(139,92,246,0.35)] sm:left-[-31px] sm:top-[2.75rem]" />

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[220px_1fr] lg:gap-10">
                  <p className="font-[family-name:var(--font-outfit)] text-base font-medium tracking-[0.16em] uppercase text-[#8B5CF6]/85 sm:text-lg sm:tracking-[0.2em]">
                    {item.time}
                  </p>
                  <div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[1.7rem] font-medium leading-tight text-[#F5F0EB] sm:text-3xl lg:text-[2.25rem]">
                      {item.title}
                    </h3>
                    {item.detail ? (
                      <p className="mt-2 max-w-xl font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-[#F5F0EB]/50 sm:mt-3 sm:text-base sm:text-[#F5F0EB]/45">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="px-4 sm:px-10 lg:px-16">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── PAST SESSIONS ─── */}
      <section id="sessions" className="relative py-16 sm:py-24 lg:py-32">
        {/* Section label */}
        <div className="reveal mb-8 sm:mb-12" />

        {/* Session cards — asymmetric grid */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {pastSessions.map((session, index) => (
            <div
              key={session.city}
              className="reveal group"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative">
                <div className="relative aspect-[1/1.18] overflow-hidden md:aspect-[4/5]">
                  <Image
                    src={session.image}
                    alt={`${session.city} session`}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] ${
                      session.monochrome ? "grayscale brightness-80" : ""
                    } ${session.darken ? "brightness-80" : ""
                    }`}
                  />
                  <div className="absolute inset-0 bg-[#0A0A0A]/18" />
                  <div className="absolute inset-0 flex items-center justify-center p-5 text-center sm:p-6">
                    <h3 className="font-[family-name:var(--font-playfair)] text-[2.3rem] font-medium tracking-[-0.02em] text-[#F5F0EB] sm:text-5xl lg:text-6xl">
                      {session.city}
                    </h3>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#8B5CF6]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative border-t border-white/[0.04] px-4 py-10 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          {/* Left */}
          <div>
            <Image
              src="/logo.png"
              alt="Omah Lay"
              width={144}
              height={40}
              className="h-7 w-auto brightness-0 invert opacity-70 sm:h-8"
            />
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-[10px] tracking-[0.2em] uppercase text-[#F5F0EB]/20">
              &copy; 2026 Omah Lay. All rights reserved.
            </p>
          </div>

          {/* Social links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-8">
            {socialLinks.map((platform) => (
              <a
                key={platform.label}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer font-[family-name:var(--font-outfit)] text-[10px] tracking-[0.2em] uppercase text-[#F5F0EB]/25 hover:text-[#8B5CF6] transition-colors duration-500"
              >
                {platform.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
