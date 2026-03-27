import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const session = await prisma.session.update({
    where: { id: Number(id) },
    data: {
      city: body?.city?.trim() || undefined,
      cityCode: body?.cityCode?.trim()?.toUpperCase() || undefined,
      country: body?.country?.trim() || undefined,
      date: body?.date?.trim() || undefined,
      venue: body?.venue?.trim() || undefined,
      status: body?.status?.trim() || undefined,
      registrationEnabled:
        typeof body?.registrationEnabled === "boolean"
          ? body.registrationEnabled
          : undefined,
    },
    include: { _count: { select: { signups: true } } },
  });

  return NextResponse.json({ session });
}
