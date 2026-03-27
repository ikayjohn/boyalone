import { SignupSuccessView, type SessionInfo, type SignupResult } from "@/app/signup-modal";

const previewSession: SessionInfo = {
  id: 1,
  city: "Lagos",
  cityCode: "LOS",
  country: "Nigeria",
  date: "TBD",
  venue: "TBD",
  status: "upcoming",
  imageUrl: null,
  capacity: 150,
  registrationEnabled: true,
  _count: { signups: 83 },
};

const previewResult: SignupResult = {
  uniqueId: "COM-LOS-48271",
  fullName: "Daniel Okafor",
  qrCodeData:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
        <rect width="220" height="220" fill="#ffffff"/>
        <rect x="16" y="16" width="52" height="52" fill="#0a0a0a"/>
        <rect x="152" y="16" width="52" height="52" fill="#0a0a0a"/>
        <rect x="16" y="152" width="52" height="52" fill="#0a0a0a"/>
        <rect x="88" y="24" width="12" height="12" fill="#0a0a0a"/>
        <rect x="112" y="24" width="12" height="12" fill="#0a0a0a"/>
        <rect x="88" y="48" width="36" height="12" fill="#0a0a0a"/>
        <rect x="88" y="88" width="12" height="12" fill="#0a0a0a"/>
        <rect x="112" y="88" width="12" height="12" fill="#0a0a0a"/>
        <rect x="136" y="88" width="12" height="12" fill="#0a0a0a"/>
        <rect x="88" y="112" width="60" height="12" fill="#0a0a0a"/>
        <rect x="88" y="136" width="12" height="12" fill="#0a0a0a"/>
        <rect x="112" y="136" width="12" height="12" fill="#0a0a0a"/>
        <rect x="136" y="136" width="36" height="12" fill="#0a0a0a"/>
        <rect x="160" y="112" width="12" height="36" fill="#0a0a0a"/>
        <rect x="88" y="160" width="12" height="12" fill="#0a0a0a"/>
        <rect x="112" y="160" width="36" height="12" fill="#0a0a0a"/>
      </svg>
    `),
};

export default function PostSignupPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto mb-6 max-w-4xl">
        <p className="font-[family-name:var(--font-outfit)] text-[10px] uppercase tracking-[0.2em] text-white/45">
          Preview
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl text-[#F6F1E8] sm:text-4xl">
          Post-signup modal state
        </h1>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden border border-black/10 bg-[#F6F1E8] shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-end border-b border-black/[0.08] px-4 py-3 sm:px-8 sm:py-4">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center border border-black/[0.08] text-[#171411]/65"
            >
              <span className="text-xl leading-none">&times;</span>
            </div>
          </div>

          <SignupSuccessView
            result={previewResult}
            session={previewSession}
            sessionCity="lagos"
          />
        </div>
      </div>
    </div>
  );
}
