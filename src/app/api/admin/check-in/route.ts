import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.signup.findMany({
    where: {
      OR: [
        {
          uniqueId: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: query,
          },
        },
        {
          fullName: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      session: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return NextResponse.json({
    results: results.map((signup) => ({
      id: signup.id,
      uniqueId: signup.uniqueId,
      fullName: signup.fullName,
      email: signup.email,
      phone: signup.phone,
      checkedIn: signup.checkedIn,
      checkedInAt: signup.checkedInAt?.toISOString() ?? null,
      createdAt: signup.createdAt.toISOString(),
      sessionCity: signup.session.city,
      sessionDate: signup.session.date,
      sessionVenue: signup.session.venue,
    })),
  });
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const uniqueId = body?.uniqueId?.trim();

  if (!uniqueId) {
    return NextResponse.json(
      { error: "A valid pass ID is required." },
      { status: 400 }
    );
  }

  const signup = await prisma.signup.findUnique({
    where: { uniqueId },
    include: { session: true },
  });

  if (!signup) {
    return NextResponse.json({ error: "Signup not found." }, { status: 404 });
  }

  if (signup.checkedIn) {
    return NextResponse.json({
      success: true,
      alreadyCheckedIn: true,
      signup: {
        uniqueId: signup.uniqueId,
        checkedIn: signup.checkedIn,
        checkedInAt: signup.checkedInAt?.toISOString() ?? null,
      },
    });
  }

  const updated = await prisma.signup.update({
    where: { uniqueId },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    signup: {
      uniqueId: updated.uniqueId,
      checkedIn: updated.checkedIn,
      checkedInAt: updated.checkedInAt?.toISOString() ?? null,
    },
  });
}
