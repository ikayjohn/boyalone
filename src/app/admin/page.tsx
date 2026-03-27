import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/site-content";
import AdminDashboardClient from "./dashboard-client";

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/admin/login");

  const analyticsClient = (prisma as typeof prisma & {
    analyticsEvent?: {
      groupBy: typeof prisma.analyticsEvent.groupBy;
      findMany: typeof prisma.analyticsEvent.findMany;
    };
    siteContent?: {
      findUnique: typeof prisma.siteContent.findUnique;
    };
    savedSignupFilter?: {
      findMany: typeof prisma.savedSignupFilter.findMany;
    };
  }).analyticsEvent;
  const siteContentClient = (prisma as typeof prisma & {
    siteContent?: {
      findUnique: typeof prisma.siteContent.findUnique;
    };
  }).siteContent;
  const savedSignupFilterClient = (prisma as typeof prisma & {
    savedSignupFilter?: {
      findMany: typeof prisma.savedSignupFilter.findMany;
    };
  }).savedSignupFilter;

  const [
    sessions,
    signups,
    groupedAnalytics,
    uniqueVisitors,
    attributionEvents,
    siteContent,
    savedFilters,
  ] = await Promise.all([
    prisma.session.findMany({
      include: { _count: { select: { signups: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.signup.findMany({
      include: { session: true },
      orderBy: { createdAt: "desc" },
    }),
    analyticsClient
      ? analyticsClient.groupBy({
          by: ["eventType"],
          _count: { _all: true },
        })
      : Promise.resolve([]),
    analyticsClient
      ? analyticsClient.findMany({
          where: {
            eventType: "homepage_view",
            visitorId: { not: null },
          },
          distinct: ["visitorId"],
          select: { visitorId: true },
        })
      : Promise.resolve([]),
    analyticsClient
      ? analyticsClient.findMany({
          where: {
            eventType: "homepage_view",
          },
          select: {
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([]),
    siteContentClient
      ? siteContentClient.findUnique({
          where: { key: "homepage" },
        })
      : Promise.resolve(null),
    savedSignupFilterClient
      ? savedSignupFilterClient.findMany({
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const totalSignups = signups.length;
  const checkedInCount = signups.filter(
    (s: (typeof signups)[number]) => s.checkedIn
  ).length;
  const analyticsCounts = groupedAnalytics.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.eventType] = item._count._all;
      return acc;
    },
    {}
  );
  const homepageVisits = analyticsCounts.homepage_view ?? 0;
  const registerClicks = analyticsCounts.register_click ?? 0;
  const modalOpens = analyticsCounts.registration_modal_open ?? 0;
  const presaveClicks = analyticsCounts.presave_click ?? 0;
  const formUnlocks = analyticsCounts.registration_form_unlock ?? 0;
  const signupCompletions = analyticsCounts.signup_complete ?? totalSignups;
  const visitToSignupRate =
    homepageVisits > 0
      ? `${Math.round((signupCompletions / homepageVisits) * 100)}%`
      : "0%";
  const topAttribution = attributionEvents.reduce<
    Array<{ label: string; count: number }>
  >((acc, event) => {
    const label =
      event.utmSource && event.utmMedium
        ? `${event.utmSource} / ${event.utmMedium}`
        : event.utmSource || event.utmCampaign || "Direct / Unknown";
    const existing = acc.find((item) => item.label === label);

    if (existing) {
      existing.count += 1;
      return acc;
    }

    acc.push({ label, count: 1 });
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);

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
    registrationEnabled: s.registrationEnabled,
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
    utmSource: s.utmSource,
  }));

  return (
    <AdminDashboardClient
      sessions={sessionsWithCounts}
      signups={serializedSignups}
      totalSignups={totalSignups}
      checkedInCount={checkedInCount}
      siteContent={siteContent ? normalizeSiteContent(siteContent) : DEFAULT_SITE_CONTENT}
      savedFilters={savedFilters.map((filter) => ({
        id: filter.id,
        name: filter.name,
        search: filter.search,
        sessionCityCode: filter.sessionCityCode,
        checkedIn:
          typeof filter.checkedIn === "boolean" ? filter.checkedIn : null,
        bodyArtPreference: filter.bodyArtPreference,
        utmSource: filter.utmSource,
      }))}
      analyticsSummary={{
        homepageVisits,
        uniqueVisitors: uniqueVisitors.length,
        registerClicks,
        modalOpens,
        presaveClicks,
        formUnlocks,
        signupCompletions,
        visitToSignupRate,
        topAttribution,
      }}
    />
  );
}
