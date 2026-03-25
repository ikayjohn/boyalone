import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboardClient from "./dashboard-client";

type SessionWithCount = Prisma.SessionGetPayload<{
  include: { _count: { select: { signups: true } } };
}>;

type SignupWithSession = Prisma.SignupGetPayload<{
  include: { session: true };
}>;

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/admin/login");

  const [sessions, signups]: [SessionWithCount[], SignupWithSession[]] =
    await Promise.all([
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
  const checkedInCount = signups.filter((s) => s.checkedIn).length;

  const sessionsWithCounts = sessions.map((s) => ({
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

  const serializedSignups = signups.map((s) => ({
    id: s.id,
    uniqueId: s.uniqueId,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    city: s.city,
    instagram: s.instagram,
    referralSource: s.referralSource,
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
