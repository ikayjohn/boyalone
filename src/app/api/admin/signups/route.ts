import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSignupWhereClause } from "@/lib/signup-filters";

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const where = buildSignupWhereClause({
      search: searchParams.get("search") || "",
      sessionCityCode: searchParams.get("session") || "",
      checkedIn: searchParams.get("checkedIn"),
      bodyArtPreference: searchParams.get("bodyArtPreference") || "",
      utmSource: searchParams.get("utmSource") || "",
    });

    const signups = await prisma.signup.findMany({
      where,
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(signups);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signups" },
      { status: 500 }
    );
  }
}
