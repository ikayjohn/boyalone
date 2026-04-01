"use client";

import { useState } from "react";

interface SessionOption {
  id: number;
  city: string;
  cityCode: string;
  date: string;
  venue: string;
}

interface GeneratedTicket {
  uniqueId: string;
  qrCodeData: string;
  fullName: string;
  email: string;
  city: string;
  date: string;
  venue: string;
}

function downloadTicketImage(ticket: GeneratedTicket) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    const qrSize = 200;
    const padding = 40;
    const textStartY = 30;
    const lineHeight = 22;
    const width = 400;
    const height = textStartY + lineHeight * 6 + 20 + qrSize + padding * 2;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Header
    ctx.fillStyle = "#8B5CF6";
    ctx.font = "bold 16px monospace";
    ctx.fillText("BOY ALONE — TICKET", padding, textStartY + 10);

    // Divider
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(padding, textStartY + 22);
    ctx.lineTo(width - padding, textStartY + 22);
    ctx.stroke();

    // Details
    ctx.fillStyle = "#999";
    ctx.font = "12px monospace";
    const labels = ["TICKET ID", "NAME", "EMAIL", "SESSION", "VENUE", "DATE"];
    const values = [
      ticket.uniqueId,
      ticket.fullName,
      ticket.email,
      ticket.city,
      ticket.venue,
      ticket.date,
    ];

    let y = textStartY + 46;
    labels.forEach((label, i) => {
      ctx.fillStyle = "#777";
      ctx.font = "11px monospace";
      ctx.fillText(label, padding, y);
      ctx.fillStyle = "#F5F0EB";
      ctx.font = "13px monospace";
      ctx.fillText(values[i], padding + 90, y);
      y += lineHeight;
    });

    // QR code
    const qrX = (width - qrSize) / 2;
    const qrY = y + 16;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

    // Download
    const link = document.createElement("a");
    link.download = `ticket-${ticket.uniqueId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = ticket.qrCodeData;
}

function downloadAllTickets(tickets: GeneratedTicket[]) {
  tickets.forEach((ticket, i) => {
    setTimeout(() => downloadTicketImage(ticket), i * 300);
  });
}

export default function GenerateTicketClient({
  sessions,
}: {
  sessions: SessionOption[];
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [count, setCount] = useState(5);
  const [sessionId, setSessionId] = useState(
    sessions.length > 0 ? String(sessions[0].id) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<GeneratedTicket[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTickets([]);
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        fullName,
        sessionId: Number(sessionId),
      };

      if (mode === "bulk") {
        payload.bulk = true;
        payload.count = count;
      } else {
        payload.email = email;
      }

      const res = await fetch("/api/admin/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setTickets(data.tickets);
      setFullName("");
      setEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        {/* Mode toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "single"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "bulk"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Bulk
          </button>
        </div>

        <div className="space-y-1">
          <label htmlFor="session" className="block text-sm font-medium">
            Session
          </label>
          <select
            id="session"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} — {s.date} ({s.venue})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-sm font-medium">
            {mode === "bulk" ? "Name (applied to all tickets)" : "Full Name"}
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={
              mode === "bulk"
                ? 'e.g. "VIP Guest" → VIP Guest #1, #2...'
                : "Attendee full name"
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          />
        </div>

        {mode === "single" && (
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="attendee@example.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>
        )}

        {mode === "bulk" && (
          <div className="space-y-1">
            <label htmlFor="count" className="block text-sm font-medium">
              Number of Tickets (max 20)
            </label>
            <input
              id="count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) =>
                setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || sessions.length === 0}
          className="w-full cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : mode === "bulk"
              ? `Generate ${count} Ticket${count > 1 ? "s" : ""}`
              : "Generate Ticket"}
        </button>
      </form>

      {/* Generated Tickets */}
      {tickets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-700">
              {tickets.length} Ticket{tickets.length > 1 ? "s" : ""} Generated
            </h2>
            <div className="flex gap-2">
              {tickets.length > 1 && (
                <button
                  type="button"
                  onClick={() => downloadAllTickets(tickets)}
                  className="cursor-pointer rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm text-white hover:bg-[#7C3AED]"
                >
                  Download All Tickets
                </button>
              )}
              <button
                type="button"
                onClick={() => setTickets([])}
                className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.uniqueId}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {ticket.uniqueId}
                    </p>
                    <p className="text-sm text-zinc-700">{ticket.fullName}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>

                <div className="mb-3 space-y-1 text-xs text-zinc-500">
                  <p>{ticket.email}</p>
                  <p>
                    {ticket.city} — {ticket.date}
                  </p>
                  <p>{ticket.venue}</p>
                </div>

                {ticket.qrCodeData && (
                  <div className="flex justify-center">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-900 p-2">
                      <img
                        src={ticket.qrCodeData}
                        alt="QR Code"
                        width={140}
                        height={140}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(ticket.uniqueId)
                    }
                    className="flex-1 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs hover:bg-zinc-50"
                  >
                    Copy ID
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTicketImage(ticket)}
                    className="flex-1 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs hover:bg-zinc-50"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
