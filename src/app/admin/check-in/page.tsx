import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth";
import CheckInClient from "./check-in-client";

export default async function AdminCheckInPage() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f3ef] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">boy alone</h1>
            <p className="text-xs text-zinc-500">Admin Check-In</p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm transition-colors hover:bg-zinc-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <CheckInClient />
      </main>
    </div>
  );
}
