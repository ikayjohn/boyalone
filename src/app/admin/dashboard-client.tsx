"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SiteContentPayload } from "@/lib/site-content";

const SIGNUPS_PER_PAGE = 100;

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
  registrationEnabled: boolean;
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
  utmSource: string | null;
}

interface SavedFilterData {
  id: number;
  name: string;
  search: string | null;
  sessionCityCode: string | null;
  checkedIn: boolean | null;
  bodyArtPreference: string | null;
  utmSource: string | null;
}

interface Props {
  sessions: SessionData[];
  signups: SignupData[];
  totalSignups: number;
  checkedInCount: number;
  siteContent: SiteContentPayload;
  savedFilters: SavedFilterData[];
  analyticsSummary: {
    homepageVisits: number;
    uniqueVisitors: number;
    registerClicks: number;
    modalOpens: number;
    presaveClicks: number;
    formUnlocks: number;
    signupCompletions: number;
    visitToSignupRate: string;
    topAttribution: Array<{ label: string; count: number }>;
  };
}

type CheckedInFilter = "all" | "true" | "false";

export default function AdminDashboardClient({
  sessions,
  signups,
  totalSignups,
  checkedInCount,
  siteContent,
  savedFilters,
  analyticsSummary,
}: Props) {
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [checkedInFilter, setCheckedInFilter] =
    useState<CheckedInFilter>("all");
  const [bodyArtFilter, setBodyArtFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignup, setSelectedSignup] = useState<SignupData | null>(null);
  const [editingSession, setEditingSession] = useState<SessionData | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [filterSaving, setFilterSaving] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [sessionFormLoading, setSessionFormLoading] = useState(false);
  const [contentForm, setContentForm] = useState(siteContent);
  const [sessionForm, setSessionForm] = useState({
    city: "",
    cityCode: "",
    country: "",
    date: "",
    venue: "",
    status: "upcoming",
  });

  useEffect(() => setContentForm(siteContent), [siteContent]);
  useEffect(
    () => setCurrentPage(1),
    [search, sessionFilter, checkedInFilter, bodyArtFilter, sourceFilter]
  );

  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(signups.map((signup) => signup.utmSource).filter(Boolean)))
        .sort() as string[],
    [signups]
  );

  const filteredSignups = useMemo(
    () =>
      signups.filter((signup) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          signup.fullName.toLowerCase().includes(query) ||
          signup.email.toLowerCase().includes(query) ||
          signup.phone.toLowerCase().includes(query) ||
          signup.uniqueId.toLowerCase().includes(query);
        const matchesSession =
          !sessionFilter || signup.sessionCityCode === sessionFilter;
        const matchesCheckedIn =
          checkedInFilter === "all" ||
          (checkedInFilter === "true" && signup.checkedIn) ||
          (checkedInFilter === "false" && !signup.checkedIn);
        const matchesBodyArt =
          bodyArtFilter === "all" ||
          signup.bodyArtPreference?.toLowerCase() === bodyArtFilter.toLowerCase();
        const matchesSource =
          sourceFilter === "all" ||
          (signup.utmSource || "").toLowerCase() === sourceFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesSession &&
          matchesCheckedIn &&
          matchesBodyArt &&
          matchesSource
        );
      }),
    [signups, search, sessionFilter, checkedInFilter, bodyArtFilter, sourceFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredSignups.length / SIGNUPS_PER_PAGE));
  const paginatedSignups = useMemo(() => {
    const start = (currentPage - 1) * SIGNUPS_PER_PAGE;
    return filteredSignups.slice(start, start + SIGNUPS_PER_PAGE);
  }, [currentPage, filteredSignups]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const tattooCount = signups.filter(
    (signup) => signup.bodyArtPreference?.toLowerCase() === "tattoo"
  ).length;
  const piercingCount = signups.filter(
    (signup) => signup.bodyArtPreference?.toLowerCase() === "piercing"
  ).length;
  const lagosSessionsCount = sessions.filter(
    (session) =>
      session.city.toLowerCase() === "lagos" ||
      session.cityCode.toLowerCase() === "lag" ||
      session.cityCode.toLowerCase() === "los"
  ).length;

  const formatSelectionStat = (count: number) =>
    `${count} (${totalSignups > 0 ? Math.round((count / totalSignups) * 100) : 0}%)`;

  function buildExportQuery() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sessionFilter) params.set("session", sessionFilter);
    if (checkedInFilter !== "all") params.set("checkedIn", checkedInFilter);
    if (bodyArtFilter !== "all") params.set("bodyArtPreference", bodyArtFilter);
    if (sourceFilter !== "all") params.set("utmSource", sourceFilter);
    return params.toString();
  }

  function handleExport(format: "xlsx" | "csv" | "json" | "pdf") {
    const query = buildExportQuery();
    window.location.href = `/api/admin/export?format=${format}${query ? `&${query}` : ""}`;
    setShowExportOptions(false);
  }

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionFormLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionForm),
      });
      if (res.ok) window.location.reload();
    } finally {
      setSessionFormLoading(false);
    }
  }

  async function handleSaveContent(e: React.FormEvent) {
    e.preventDefault();
    setContentSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentForm),
      });
      if (res.ok) window.location.reload();
    } finally {
      setContentSaving(false);
    }
  }

  async function handleSaveFilter() {
    const name = window.prompt("Name this saved list");
    if (!name) return;
    setFilterSaving(true);
    try {
      const res = await fetch("/api/admin/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          search: search || null,
          sessionCityCode: sessionFilter || null,
          checkedIn:
            checkedInFilter === "all" ? null : checkedInFilter === "true",
          bodyArtPreference: bodyArtFilter === "all" ? null : bodyArtFilter,
          utmSource: sourceFilter === "all" ? null : sourceFilter,
        }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setFilterSaving(false);
    }
  }

  async function handleDeleteFilter(id: number) {
    if (!window.confirm("Delete this saved list?")) return;
    await fetch(`/api/admin/filters/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  function applyFilter(filter: SavedFilterData) {
    setSearch(filter.search || "");
    setSessionFilter(filter.sessionCityCode || "");
    setCheckedInFilter(
      filter.checkedIn === null ? "all" : filter.checkedIn ? "true" : "false"
    );
    setBodyArtFilter(filter.bodyArtPreference || "all");
    setSourceFilter(filter.utmSource || "all");
  }

  async function handleToggleRegistration(session: SessionData) {
    await fetch(`/api/admin/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationEnabled: !session.registrationEnabled,
      }),
    });
    window.location.reload();
  }

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;
    setSessionSaving(true);
    try {
      const res = await fetch(`/api/admin/sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSession),
      });
      if (res.ok) window.location.reload();
    } finally {
      setSessionSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ef] text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-tight">boy alone</h1>
          <p className="text-xs text-zinc-500">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/check-in"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Check-In Desk
          </Link>
          <button
            onClick={() => setShowAddSession(true)}
            className="cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm text-white hover:bg-[#7C3AED]"
          >
            Add Session
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportOptions((current) => !current)}
              className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Export
            </button>
            {showExportOptions ? (
              <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-lg border border-zinc-200 bg-white shadow-lg">
                {(["xlsx", "csv", "json", "pdf"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleExport(format)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Export as {format.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1450px] space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Signups" value={totalSignups} />
          <StatCard label="Checked In" value={checkedInCount} />
          <StatCard label="Sessions" value={lagosSessionsCount} />
          <StatCard
            label="Check-in Rate"
            value={totalSignups ? `${Math.round((checkedInCount / totalSignups) * 100)}%` : "0%"}
          />
          <StatCard label="Tattoo" value={formatSelectionStat(tattooCount)} />
          <StatCard label="Body Piercing" value={formatSelectionStat(piercingCount)} />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Traffic & Funnel
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                First-party tracking from the homepage and registration flow.
              </p>
            </div>
            <span className="rounded-full bg-[#f3ecff] px-3 py-1 text-xs font-medium text-[#6d28d9]">
              Visit to Signup: {analyticsSummary.visitToSignupRate}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Site Visits" value={analyticsSummary.homepageVisits} />
            <StatCard label="Unique Visitors" value={analyticsSummary.uniqueVisitors} />
            <StatCard label="Register Clicks" value={analyticsSummary.registerClicks} />
            <StatCard label="Modal Opens" value={analyticsSummary.modalOpens} />
            <StatCard label="Pre-Save Clicks" value={analyticsSummary.presaveClicks} />
            <StatCard label="Form Unlocks" value={analyticsSummary.formUnlocks} />
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Top Sources
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {analyticsSummary.topAttribution.length > 0 ? (
                analyticsSummary.topAttribution.map((source) => (
                  <div
                    key={source.label}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span>{source.label}</span>
                    <span className="font-semibold">{source.count}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
                  No UTM source data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Session Controls"
            subtitle="Edit session details and toggle registration open or closed."
          >
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{session.city}</p>
                      <p className="text-sm text-zinc-500">
                        {session.date} • {session.venue}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Registration {session.registrationEnabled ? "open" : "closed"} • {session.signupCount} signups
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRegistration(session)}
                        className={`cursor-pointer rounded-lg px-3 py-2 text-sm text-white ${
                          session.registrationEnabled
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {session.registrationEnabled ? "Close Registration" : "Open Registration"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSession(session)}
                        className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Homepage Content"
            subtitle="Update hero copy, pre-save URL, and hero video URL without code changes."
          >
            <form onSubmit={handleSaveContent} className="space-y-3">
              <FormField label="Hero Line 1" value={contentForm.heroLine1} onChange={(value) => setContentForm({ ...contentForm, heroLine1: value })} />
              <FormField label="Hero Line 2" value={contentForm.heroLine2} onChange={(value) => setContentForm({ ...contentForm, heroLine2: value })} />
              <FormField label="Hero Line 3" value={contentForm.heroLine3} onChange={(value) => setContentForm({ ...contentForm, heroLine3: value })} />
              <FormField label="Hero Accent" value={contentForm.heroAccent} onChange={(value) => setContentForm({ ...contentForm, heroAccent: value })} />
              <FormField label="Hero Video URL" value={contentForm.heroVideoUrl} onChange={(value) => setContentForm({ ...contentForm, heroVideoUrl: value })} />
              <FormField label="Pre-Save URL" value={contentForm.presaveUrl} onChange={(value) => setContentForm({ ...contentForm, presaveUrl: value })} />
              <TextAreaField label="Hero Subtitle" value={contentForm.heroSubtitle} onChange={(value) => setContentForm({ ...contentForm, heroSubtitle: value })} />
              <button
                type="submit"
                disabled={contentSaving}
                className="w-full cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7C3AED] disabled:opacity-50"
              >
                {contentSaving ? "Saving..." : "Save Homepage Content"}
              </button>
            </form>
          </Panel>
        </div>

        <Panel
          title="Signup Filters"
          subtitle="Filter by session, source, body art, and check-in status. Save filtered lists for outreach or export."
        >
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:justify-between">
            <div className="grid gap-3 lg:grid-cols-5 xl:flex-1">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, ID" className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-[#8B5CF6] focus:outline-none" />
              <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-[#8B5CF6] focus:outline-none">
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.cityCode}>{session.city} ({session.cityCode})</option>
                ))}
              </select>
              <select value={checkedInFilter} onChange={(e) => setCheckedInFilter(e.target.value as CheckedInFilter)} className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-[#8B5CF6] focus:outline-none">
                <option value="all">All Check-In Status</option>
                <option value="true">Checked In</option>
                <option value="false">Not Checked In</option>
              </select>
              <select value={bodyArtFilter} onChange={(e) => setBodyArtFilter(e.target.value)} className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-[#8B5CF6] focus:outline-none">
                <option value="all">All Body Art</option>
                <option value="Tattoo">Tattoo</option>
                <option value="Piercing">Piercing</option>
                <option value="None">None</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-[#8B5CF6] focus:outline-none">
                <option value="all">All Sources</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSaveFilter}
              disabled={filterSaving}
              className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              {filterSaving ? "Saving..." : "Save Current List"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm">
                <button type="button" onClick={() => applyFilter(filter)} className="cursor-pointer text-zinc-700 hover:text-zinc-900">
                  {filter.name}
                </button>
                <button type="button" onClick={() => handleDeleteFilter(filter.id)} className="cursor-pointer text-zinc-400 hover:text-red-500">
                  ×
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredSignups.length === 0 ? 0 : (currentPage - 1) * SIGNUPS_PER_PAGE + 1}
              {" - "}
              {Math.min(currentPage * SIGNUPS_PER_PAGE, filteredSignups.length)} of {filteredSignups.length} filtered signups
            </span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Phone</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Source</th>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Date</th>
                  <th className="px-4 py-3 font-medium">Checked In</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignups.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No signups found.</td></tr>
                ) : (
                  paginatedSignups.map((signup) => (
                    <tr key={signup.id} onClick={() => setSelectedSignup(signup)} className="cursor-pointer border-b border-zinc-100 hover:bg-[#f8f5ff]">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{signup.uniqueId}</td>
                      <td className="px-4 py-3 font-medium">{signup.fullName}</td>
                      <td className="px-4 py-3 text-zinc-600">{signup.email}</td>
                      <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{signup.phone}</td>
                      <td className="hidden px-4 py-3 text-zinc-600 lg:table-cell">{signup.utmSource || "Direct"}</td>
                      <td className="px-4 py-3"><span className="rounded bg-[#f3ecff] px-2 py-0.5 text-xs text-[#6d28d9]">{signup.sessionCity}</span></td>
                      <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">{new Date(signup.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className={`inline-block h-2 w-2 rounded-full ${signup.checkedIn ? "bg-green-500" : "bg-zinc-300"}`} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredSignups.length === 0 ? 0 : (currentPage - 1) * SIGNUPS_PER_PAGE + 1}
              {" - "}
              {Math.min(currentPage * SIGNUPS_PER_PAGE, filteredSignups.length)} of {filteredSignups.length} filtered signups
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1} className="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages} className="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedSignup ? (
        <ModalShell onClose={() => setSelectedSignup(null)}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Signup Details</h2>
              <button onClick={() => setSelectedSignup(null)} className="cursor-pointer text-xl leading-none text-zinc-500 hover:text-zinc-900">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Unique ID" value={selectedSignup.uniqueId} />
              <Detail label="Full Name" value={selectedSignup.fullName} />
              <Detail label="Email" value={selectedSignup.email} />
              <Detail label="Phone" value={selectedSignup.phone} />
              <Detail label="Source" value={selectedSignup.utmSource || "Direct"} />
              <Detail label="Body Art Preference" value={selectedSignup.bodyArtPreference || "—"} />
              <Detail label="Session" value={selectedSignup.sessionCity} />
              <Detail label="Checked In" value={selectedSignup.checkedIn ? "Yes" : "No"} />
            </div>
          </div>
        </ModalShell>
      ) : null}

      {showAddSession ? (
        <ModalShell onClose={() => setShowAddSession(false)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Session</h2>
              <button onClick={() => setShowAddSession(false)} className="cursor-pointer text-xl leading-none text-zinc-500 hover:text-zinc-900">&times;</button>
            </div>
            <form onSubmit={handleAddSession} className="space-y-3">
              <FormField label="City" value={sessionForm.city} onChange={(value) => setSessionForm({ ...sessionForm, city: value })} required />
              <FormField label="City Code" value={sessionForm.cityCode} onChange={(value) => setSessionForm({ ...sessionForm, cityCode: value })} required />
              <FormField label="Country" value={sessionForm.country} onChange={(value) => setSessionForm({ ...sessionForm, country: value })} required />
              <FormField label="Date" value={sessionForm.date} onChange={(value) => setSessionForm({ ...sessionForm, date: value })} />
              <FormField label="Venue" value={sessionForm.venue} onChange={(value) => setSessionForm({ ...sessionForm, venue: value })} />
              <FormField label="Status" value={sessionForm.status} onChange={(value) => setSessionForm({ ...sessionForm, status: value })} />
              <button type="submit" disabled={sessionFormLoading} className="w-full cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7C3AED] disabled:opacity-50">
                {sessionFormLoading ? "Creating..." : "Create Session"}
              </button>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {editingSession ? (
        <ModalShell onClose={() => setEditingSession(null)}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Session</h2>
              <button onClick={() => setEditingSession(null)} className="cursor-pointer text-xl leading-none text-zinc-500 hover:text-zinc-900">&times;</button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-3">
              <FormField label="City" value={editingSession.city} onChange={(value) => setEditingSession({ ...editingSession, city: value })} />
              <FormField label="City Code" value={editingSession.cityCode} onChange={(value) => setEditingSession({ ...editingSession, cityCode: value })} />
              <FormField label="Country" value={editingSession.country} onChange={(value) => setEditingSession({ ...editingSession, country: value })} />
              <FormField label="Date" value={editingSession.date} onChange={(value) => setEditingSession({ ...editingSession, date: value })} />
              <FormField label="Venue" value={editingSession.venue} onChange={(value) => setEditingSession({ ...editingSession, venue: value })} />
              <FormField label="Status" value={editingSession.status} onChange={(value) => setEditingSession({ ...editingSession, status: value })} />
              <label className="flex items-center gap-3 pt-2 text-sm text-zinc-700">
                <input type="checkbox" checked={editingSession.registrationEnabled} onChange={(e) => setEditingSession({ ...editingSession, registrationEnabled: e.target.checked })} />
                Registration enabled
              </label>
              <button type="submit" disabled={sessionSaving} className="w-full cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7C3AED] disabled:opacity-50">
                {sessionSaving ? "Saving..." : "Save Session"}
              </button>
            </form>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="break-all text-sm text-zinc-900">{value}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none"
      />
    </div>
  );
}
