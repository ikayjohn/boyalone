import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/site-content";

export async function GET() {
  try {
    const content = await prisma.siteContent.findUnique({
      where: { key: "homepage" },
    });

    return NextResponse.json({
      content: content
        ? normalizeSiteContent(content)
        : DEFAULT_SITE_CONTENT,
    });
  } catch {
    return NextResponse.json({
      content: DEFAULT_SITE_CONTENT,
    });
  }
}
