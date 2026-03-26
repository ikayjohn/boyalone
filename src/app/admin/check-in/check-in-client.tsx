"use client";

import { useEffect, useState } from "react";

interface CheckInResult {
  id: number;
  uniqueId: string;
  fullName: string;
  email: string;
  phone: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  sessionCity: string;
  sessionDate: string;
  sessionVenue: string;
}

export default function CheckInClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckInResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  async function runSearch(rawQuery: string) {
    const trimmedQuery = rawQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/check-in?q=${encodeURIComponent(trimmedQuery)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResults(data.results);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error ? searchError.message : "Search failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError("");
      return;
    }

    const timeout = window.setTimeout(() => {
      void runSearch(trimmedQuery);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(query);
  }

  async function handleCheckIn(uniqueId: string) {
    setActiveId(uniqueId);
    setError("");

    try {
      const res = await fetch("/api/admin/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uniqueId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check-in failed.");
      }

      setResults((currentResults) =>
        currentResults.map((result) =>
          result.uniqueId === uniqueId
            ? {
                ...result,
                checkedIn: true,
                checkedInAt: data.signup.checkedInAt,
              }
            : result
        )
      );
    } catch (checkInError) {
      setError(
        checkInError instanceof Error
          ? checkInError.message
          : "Check-in failed."
      );
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Find attendee</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Search using the pass ID, email address, phone number, or attendee
          name. Once you find the right person, you can check them in from this
          screen.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, email, phone, or name"
            autoComplete="off"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#8B5CF6] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#8B5CF6] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
            Results
          </h3>
        </div>

        {results.length === 0 ? (
          <div className="px-6 py-10 text-sm text-zinc-500">
            Search for an attendee to see matching registrations here.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">
                      {result.fullName}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">
                      {result.uniqueId}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
                    <Info label="Email" value={result.email} />
                    <Info label="Phone" value={result.phone} />
                    <Info label="Session" value={result.sessionCity} />
                    <Info label="Date" value={result.sessionDate} />
                    <Info label="Venue" value={result.sessionVenue} />
                    <Info
                      label="Registered"
                      value={new Date(result.createdAt).toLocaleString()}
                    />
                  </div>
                </div>

                <div className="min-w-[210px]">
                  {result.checkedIn ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center">
                      <p className="text-sm font-semibold text-green-700">
                        Checked in
                      </p>
                      {result.checkedInAt ? (
                        <p className="mt-1 text-xs text-green-700/80">
                          {new Date(result.checkedInAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(result.uniqueId)}
                      disabled={activeId === result.uniqueId}
                      className="w-full rounded-lg bg-[#8B5CF6] px-4 py-4 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {activeId === result.uniqueId
                        ? "Checking in..."
                        : "Check in attendee"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 break-all text-sm text-zinc-700">{value}</p>
    </div>
  );
}
