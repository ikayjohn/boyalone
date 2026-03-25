"use client";

import { useState } from "react";

interface CheckInButtonProps {
  uniqueId: string;
  initialCheckedIn: boolean;
  initialCheckedInAt: string | null;
}

export function CheckInButton({
  uniqueId,
  initialCheckedIn,
  initialCheckedInAt,
}: CheckInButtonProps) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(
    initialCheckedInAt
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckIn() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/verify/${uniqueId}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to check in");
      }

      const data = await res.json();

      if (data.alreadyCheckedIn) {
        setCheckedIn(true);
        setCheckedInAt(data.checkedInAt);
      } else {
        setCheckedIn(true);
        setCheckedInAt(data.checkedInAt);
      }
    } catch {
      setError("Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkedIn) {
    return (
      <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
        <p className="text-green-400 font-bold text-lg">
          Checked In
        </p>
        {checkedInAt && (
          <p className="text-neutral-400 text-sm mt-1">
            {new Date(checkedInAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl py-5 transition-colors"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Checking In...
          </span>
        ) : (
          "Check In"
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm text-center mt-3">{error}</p>
      )}
    </div>
  );
}
