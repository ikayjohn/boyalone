import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/site-content";

export async function GET() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = await prisma.siteContent.findUnique({
    where: { key: "homepage" },
  });

  return NextResponse.json({
    content: content ? normalizeSiteContent(content) : DEFAULT_SITE_CONTENT,
  });
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const normalized = normalizeSiteContent(body);

  const content = await prisma.siteContent.upsert({
    where: { key: "homepage" },
    update: normalized,
    create: {
      key: "homepage",
      ...normalized,
    },
  });

  return NextResponse.json({ content: normalizeSiteContent(content) });
}
