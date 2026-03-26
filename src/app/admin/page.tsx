import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboardClient from "./dashboard-client";

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/admin/login");

  const [sessions, signups] = await Promise.all([
    prisma.session.findMany({
      include: { _count: { select: { signups: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.signup.findMany({
      include: { session: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalSignups = signups.length;
  const checkedInCount = signups.filter(
    (s: (typeof signups)[number]) => s.checkedIn
  ).length;

  const sessionsWithCounts = sessions.map((s: (typeof sessions)[number]) => ({
    id: s.id,
    city: s.city,
    cityCode: s.cityCode,
    country: s.country,
    date: s.date,
    venue: s.venue,
    status: s.status,
    imageUrl: s.imageUrl,
    capacity: s.capacity,
    signupCount: s._count.signups,
  }));

  const serializedSignups = signups.map((s: (typeof signups)[number]) => ({
    id: s.id,
    uniqueId: s.uniqueId,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    city: s.city,
    instagram: s.instagram,
    xUsername: s.xUsername,
    tiktokUsername: s.tiktokUsername,
    bodyArtPreference: s.bodyArtPreference,
    checkedIn: s.checkedIn,
    checkedInAt: s.checkedInAt?.toISOString() || null,
    qrCodeData: s.qrCodeData,
    createdAt: s.createdAt.toISOString(),
    sessionCity: s.session.city,
    sessionCityCode: s.session.cityCode,
  }));

  return (
    <AdminDashboardClient
      sessions={sessionsWithCounts}
      signups={serializedSignups}
      totalSignups={totalSignups}
      checkedInCount={checkedInCount}
    />
  );
}
