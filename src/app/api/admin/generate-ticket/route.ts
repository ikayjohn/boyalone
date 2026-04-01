import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQRCode, generateUniqueId } from "@/lib/qr";

function randomEmail(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ticket-${id}@generated.local`;
}

async function createTicket(
  session: { id: number; cityCode: string; city: string; date: string; venue: string },
  fullName: string,
  email: string
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const uniqueId = generateUniqueId(session.cityCode);
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${uniqueId}`;
    const qrCodeData = await generateQRCode(verifyUrl);

    try {
      const signup = await prisma.signup.create({
        data: {
          uniqueId,
          sessionId: session.id,
          fullName,
          email,
          phone: "N/A",
          city: session.city,
          instagram: null,
          xUsername: null,
          tiktokUsername: null,
          bodyArtPreference: "None",
          agreedToTerms: true,
          qrCodeData,
          utmSource: "admin",
        },
      });
      return {
        uniqueId: signup.uniqueId,
        qrCodeData: signup.qrCodeData,
        fullName: signup.fullName,
        email: signup.email,
        city: session.city,
        date: session.date,
        venue: session.venue,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, email, sessionId, bulk, count } = body;

    if (!fullName?.trim() || !sessionId) {
      return NextResponse.json(
        { error: "Name and session are required." },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    // --- Bulk mode ---
    if (bulk) {
      const ticketCount = Math.min(Math.max(Number(count) || 1, 1), 20);
      const tickets = [];

      for (let i = 1; i <= ticketCount; i++) {
        const name = `${fullName.trim()} #${i}`;
        const dummyEmail = randomEmail();
        const ticket = await createTicket(session, name, dummyEmail);
        if (!ticket) {
          return NextResponse.json(
            { error: `Failed to generate ticket #${i}. Please try again.` },
            { status: 500 }
          );
        }
        tickets.push(ticket);
      }

      return NextResponse.json({ success: true, tickets });
    }

    // --- Single mode ---
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.signup.findFirst({
      where: {
        sessionId: session.id,
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered for this session." },
        { status: 409 }
      );
    }

    const ticket = await createTicket(session, fullName.trim(), normalizedEmail);

    if (!ticket) {
      return NextResponse.json(
        { error: "Could not generate a unique pass ID. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tickets: [ticket] });
  } catch (error) {
    console.error("Generate ticket failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
