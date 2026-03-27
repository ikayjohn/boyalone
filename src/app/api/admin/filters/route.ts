import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await prisma.savedSignupFilter.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ filters });
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Filter name is required." },
      { status: 400 }
    );
  }

  const filter = await prisma.savedSignupFilter.create({
    data: {
      name,
      search: body?.search?.trim() || null,
      sessionCityCode: body?.sessionCityCode?.trim() || null,
      checkedIn:
        typeof body?.checkedIn === "boolean" ? body.checkedIn : null,
      bodyArtPreference: body?.bodyArtPreference?.trim() || null,
      utmSource: body?.utmSource?.trim() || null,
    },
  });

  return NextResponse.json({ filter }, { status: 201 });
}
