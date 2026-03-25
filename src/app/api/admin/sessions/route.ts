import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await prisma.session.findMany({
      include: { _count: { select: { signups: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { city, cityCode, country, date, venue, status } = body;
    const normalizedCity = city?.trim();
    const normalizedCityCode = cityCode?.trim().toUpperCase();
    const normalizedCountry = country?.trim();

    if (!normalizedCity || !normalizedCityCode || !normalizedCountry) {
      return NextResponse.json(
        { error: "city, cityCode, and country are required" },
        { status: 400 }
      );
    }

    const existingSession = await prisma.session.findFirst({
      where: {
        OR: [
          {
            city: {
              equals: normalizedCity,
              mode: "insensitive",
            },
          },
          {
            cityCode: {
              equals: normalizedCityCode,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "A session with this city or city code already exists." },
        { status: 409 }
      );
    }

    const session = await prisma.session.create({
      data: {
        city: normalizedCity,
        cityCode: normalizedCityCode,
        country: normalizedCountry,
        date: date || "TBA",
        venue: venue || "TBA",
        status: status || "upcoming",
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
