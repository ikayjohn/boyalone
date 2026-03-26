"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

interface SessionData {
  id: number;
  city: string;
  cityCode: string;
  country: string;
  date: string;
  venue: string;
  status: string;
  imageUrl: string | null;
  capacity: number | null;
  signupCount: number;
}

interface SignupData {
  id: number;
  uniqueId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  instagram: string | null;
  xUsername: string | null;
  tiktokUsername: string | null;
  bodyArtPreference: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  qrCodeData: string | null;
  createdAt: string;
  sessionCity: string;
  sessionCityCode: string;
}

interface Props {
  sessions: SessionData[];
  signups: SignupData[];
  totalSignups: number;
  checkedInCount: number;
}

export default function AdminDashboardClient({
  sessions,
  signups,
  totalSignups,
  checkedInCount,
}: Props) {
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [selectedSignup, setSelectedSignup] = useState<SignupData | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    city: "",
    cityCode: "",
    country: "",
    date: "",
    venue: "",
    status: "upcoming",
  });
  const [sessionFormLoading, setSessionFormLoading] = useState(false);

  const sessionsWithSignups = useMemo(
    () => sessions.filter((session) => session.signupCount > 0),
    [sessions]
  );

  const filterSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.cityCode.toLowerCase() === "lag" ||
          session.cityCode.toLowerCase() === "los" ||
          session.city.toLowerCase() === "lagos"
      ),
    [sessions]
  );

  const filteredSignups = useMemo(() => {
    return signups.filter((s) => {
      const matchesSearch =
        !search ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesSession =
        !sessionFilter || s.sessionCityCode === sessionFilter;
      return matchesSearch && matchesSession;
    });
  }, [signups, search, sessionFilter]);

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionFormLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionForm),
      });
      if (res.ok) {
        setShowAddSession(false);
        setSessionForm({
          city: "",
          cityCode: "",
          country: "",
          date: "",
          venue: "",
          status: "upcoming",
        });
        window.location.reload();
      }
    } finally {
      setSessionFormLoading(false);
    }
  }

  function handleExport() {
    window.location.href = "/api/admin/export";
  }

  return (
    <div className="min-h-screen bg-[#f6f3ef] text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">boy alone</h1>
          <p className="text-zinc-500 text-xs">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/check-in"
            className="px-4 py-2 text-sm rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 transition-colors"
          >
            Check-In Desk
          </Link>
          <button
            onClick={() => setShowAddSession(true)}
            className="px-4 py-2 text-sm rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors cursor-pointer"
          >
            Add Session
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 transition-colors cursor-pointer"
          >
            Export to Excel
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Signups" value={totalSignups} />
          <StatCard label="Checked In" value={checkedInCount} />
          <StatCard label="Sessions" value={filterSessions.length} />
          <StatCard
            label="Check-in Rate"
            value={
              totalSignups > 0
                ? `${Math.round((checkedInCount / totalSignups) * 100)}%`
                : "0%"
            }
          />
        </div>

        {/* Per-session breakdown */}
        {sessionsWithSignups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessionsWithSignups.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="font-medium text-sm">{s.city}</p>
                  <p className="text-zinc-500 text-xs">
                    {s.country} &middot; {s.date} &middot;{" "}
                    <span
                      className={
                        s.status === "active"
                          ? "text-green-600"
                          : s.status === "sold_out"
                            ? "text-red-500"
                            : "text-zinc-500"
                      }
                    >
                      {s.status}
                    </span>
                  </p>
                </div>
                <span className="text-[#8B5CF6] font-bold text-lg">
                  {s.signupCount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white/70 px-4 py-6 text-sm text-zinc-500">
            Session stats appear once a session has at least one signup.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg bg-white border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="rounded-lg bg-white border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer"
          >
            <option value="">All Sessions</option>
            {filterSessions.map((s) => (
              <option key={s.id} value={s.cityCode}>
                {s.city} ({s.cityCode})
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    City
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Instagram
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Session</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    Checked In
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSignups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                      No signups found.
                    </td>
                  </tr>
                ) : (
                  filteredSignups.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSignup(s)}
                      className="border-b border-zinc-100 hover:bg-[#f8f5ff] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {s.uniqueId}
                      </td>
                      <td className="px-4 py-3 font-medium">{s.fullName}</td>
                      <td className="px-4 py-3 text-zinc-600">{s.email}</td>
                      <td className="px-4 py-3 text-zinc-600 hidden md:table-cell">
                        {s.phone}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 hidden lg:table-cell">
                        {s.city}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 hidden lg:table-cell">
                        {s.instagram || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#f3ecff] text-[#6d28d9] px-2 py-0.5 rounded text-xs">
                          {s.sessionCity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {s.checkedIn ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-zinc-300" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-zinc-200 text-xs text-zinc-500">
            Showing {filteredSignups.length} of {signups.length} signups
          </div>
        </div>
      </div>

      {/* Signup Detail Modal */}
      {selectedSignup && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSignup(null)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Signup Details</h2>
              <button
                onClick={() => setSelectedSignup(null)}
                className="text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Unique ID" value={selectedSignup.uniqueId} />
              <Detail label="Full Name" value={selectedSignup.fullName} />
              <Detail label="Email" value={selectedSignup.email} />
              <Detail label="Phone" value={selectedSignup.phone} />
              <Detail label="City" value={selectedSignup.city} />
              <Detail
                label="Instagram"
                value={selectedSignup.instagram || "—"}
              />
              <Detail
                label="X"
                value={selectedSignup.xUsername || "—"}
              />
              <Detail
                label="TikTok"
                value={selectedSignup.tiktokUsername || "—"}
              />
              <Detail
                label="Body Art Preference"
                value={selectedSignup.bodyArtPreference || "—"}
              />
              <Detail label="Session" value={selectedSignup.sessionCity} />
              <Detail
                label="Checked In"
                value={selectedSignup.checkedIn ? "Yes" : "No"}
              />
              <Detail
                label="Checked In At"
                value={
                  selectedSignup.checkedInAt
                    ? new Date(selectedSignup.checkedInAt).toLocaleString()
                    : "—"
                }
              />
              <Detail
                label="Registered"
                value={new Date(selectedSignup.createdAt).toLocaleString()}
              />
            </div>

            {selectedSignup.qrCodeData && (
              <div className="flex flex-col items-center pt-2">
                <p className="text-xs text-zinc-500 mb-2">QR Code</p>
                <img
                  src={selectedSignup.qrCodeData}
                  alt="QR Code"
                  className="w-40 h-40 rounded-lg border border-zinc-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddSession && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddSession(false)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Session</h2>
              <button
                onClick={() => setShowAddSession(false)}
                className="text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-3">
              <FormField
                label="City"
                required
                value={sessionForm.city}
                onChange={(v) => setSessionForm({ ...sessionForm, city: v })}
                placeholder="e.g. Lagos"
              />
              <FormField
                label="City Code"
                required
                value={sessionForm.cityCode}
                onChange={(v) =>
                  setSessionForm({ ...sessionForm, cityCode: v })
                }
                placeholder="e.g. LAG"
              />
              <FormField
                label="Country"
                required
                value={sessionForm.country}
                onChange={(v) =>
                  setSessionForm({ ...sessionForm, country: v })
                }
                placeholder="e.g. Nigeria"
              />
              <FormField
                label="Date"
                value={sessionForm.date}
                onChange={(v) => setSessionForm({ ...sessionForm, date: v })}
                placeholder="e.g. March 30, 2026 or TBA"
              />
              <FormField
                label="Venue"
                value={sessionForm.venue}
                onChange={(v) => setSessionForm({ ...sessionForm, venue: v })}
                placeholder="e.g. Eko Convention Center"
              />
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={sessionForm.status}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, status: e.target.value })
                  }
                  className="w-full rounded-lg bg-white border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sessionFormLoading}
                className="w-full rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer mt-2"
              >
                {sessionFormLoading ? "Creating..." : "Create Session"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="text-zinc-900 text-sm break-all">{value}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg bg-white border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#8B5CF6] transition-colors"
      />
    </div>
  );
}
