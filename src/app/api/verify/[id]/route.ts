import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const signup = await prisma.signup.findUnique({
      where: { uniqueId: id },
      include: { session: true },
    });

    if (!signup) {
      return NextResponse.json(
        { error: "Signup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(signup);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const signup = await prisma.signup.findUnique({
      where: { uniqueId: id },
      include: { session: true },
    });

    if (!signup) {
      return NextResponse.json(
        { error: "Signup not found" },
        { status: 404 }
      );
    }

    if (signup.checkedIn) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        checkedInAt: signup.checkedInAt,
      });
    }

    const updated = await prisma.signup.update({
      where: { uniqueId: id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
      include: { session: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
