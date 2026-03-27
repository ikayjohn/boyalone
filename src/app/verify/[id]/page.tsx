import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;

  const signup = await prisma.signup.findUnique({
    where: { uniqueId: id },
    include: { session: true },
  });

  if (!signup) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/40">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Invalid Ticket
          </h1>
          <p className="text-neutral-400 text-lg">
            This QR code does not match any registration.
          </p>
          <p className="text-neutral-500 text-sm mt-4 font-mono">{id}</p>
        </div>
      </div>
    );
  }

  const isCheckedIn = signup.checkedIn;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Status indicator */}
        <div className="mb-8 text-center">
          {isCheckedIn ? (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/50">
              <svg
                className="h-14 w-14 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 ring-4 ring-amber-500/50">
              <svg
                className="h-14 w-14 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          <p
            className={`text-2xl font-bold uppercase tracking-wide ${
              isCheckedIn ? "text-green-400" : "text-amber-400"
            }`}
          >
            {isCheckedIn ? "Checked In" : "Ready"}
          </p>

          {isCheckedIn && signup.checkedInAt && (
            <p className="text-neutral-500 text-sm mt-1">
              {new Date(signup.checkedInAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Attendee info */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-6 space-y-5">
          {/* Name */}
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
              Name
            </p>
            <p className="text-white text-3xl font-bold leading-tight">
              {signup.fullName}
            </p>
          </div>

          {/* Unique ID */}
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
              Ticket ID
            </p>
            <p className="text-white text-xl font-mono font-semibold">
              {signup.uniqueId}
            </p>
          </div>

          {/* Session info */}
          <div className="flex gap-6">
            <div className="flex-1">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
                City
              </p>
              <p className="text-white text-lg font-semibold">
                {signup.session.city}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
                Date
              </p>
              <p className="text-white text-lg font-semibold">
                {signup.session.date}
              </p>
            </div>
          </div>

          {/* Venue */}
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
              Venue
            </p>
            <p className="text-white text-lg font-semibold">
              {signup.session.venue}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-neutral-500">
            Check-In
          </p>
          <p className="mt-2 text-neutral-200">
            Event staff will check you in at the venue.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            This page is now read-only and cannot mark attendance.
          </p>
        </div>
      </div>
    </div>
  );
}
