import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ANALYTICS_EVENT_TYPES, type AnalyticsEventType } from "@/lib/analytics";

function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  return ANALYTICS_EVENT_TYPES.includes(value as AnalyticsEventType);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body?.eventType?.trim();
    const path = body?.path?.trim() || null;
    const visitorId = body?.visitorId?.trim() || null;
    const sessionId = body?.sessionId?.trim() || null;
    const utmSource = body?.utmSource?.trim() || null;
    const utmMedium = body?.utmMedium?.trim() || null;
    const utmCampaign = body?.utmCampaign?.trim() || null;
    const utmTerm = body?.utmTerm?.trim() || null;
    const utmContent = body?.utmContent?.trim() || null;

    if (!eventType || !isAnalyticsEventType(eventType)) {
      return NextResponse.json(
        { error: "Invalid analytics event type." },
        { status: 400 }
      );
    }

    const referrer = request.headers.get("referer");
    const userAgent = request.headers.get("user-agent");

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        path,
        visitorId,
        sessionId,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        referrer,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to record analytics event." },
      { status: 500 }
    );
  }
}
