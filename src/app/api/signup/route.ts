import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQRCode, generateUniqueId } from "@/lib/qr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sessionCity,
      fullName,
      email,
      phone,
      city,
      instagram,
      xUsername,
      tiktokUsername,
      bodyArtPreference,
      agreedToTerms,
    } = body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    // Validate required fields
    if (
      !sessionCity ||
      !fullName ||
      !email ||
      !phone ||
      !city ||
      !instagram ||
      !xUsername ||
      !tiktokUsername ||
      !bodyArtPreference
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the terms to continue." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Find the session by city (case-insensitive)
    const session = await prisma.session.findFirst({
      where: {
        city: {
          equals: sessionCity,
          mode: "insensitive",
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found for this city." },
        { status: 404 }
      );
    }

    // Check for duplicate email in this session
    const existingSignup = await prisma.signup.findFirst({
      where: {
        sessionId: session.id,
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existingSignup) {
      return NextResponse.json(
        { error: "This email is already registered for this session." },
        { status: 409 }
      );
    }

    const existingPhoneSignup = await prisma.signup.findFirst({
      where: {
        sessionId: session.id,
        phone: normalizedPhone,
      },
    });

    if (existingPhoneSignup) {
      return NextResponse.json(
        { error: "This phone number is already registered for this session." },
        { status: 409 }
      );
    }

    // Check capacity
    if (session.capacity) {
      const currentCount = await prisma.signup.count({
        where: { sessionId: session.id },
      });
      if (currentCount >= session.capacity) {
        return NextResponse.json(
          { error: "This session is full. No more spots available." },
          { status: 410 }
        );
      }
    }

    let signup = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const uniqueId = generateUniqueId(session.cityCode);
      const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${uniqueId}`;
      const qrCodeData = await generateQRCode(verifyUrl);

      try {
        signup = await prisma.signup.create({
          data: {
            uniqueId,
            sessionId: session.id,
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            city: city.trim(),
            instagram: instagram?.trim() || null,
            xUsername: xUsername?.trim().replace(/^@/, "") || null,
            tiktokUsername: tiktokUsername?.trim().replace(/^@/, "") || null,
            bodyArtPreference: bodyArtPreference || null,
            agreedToTerms: true,
            qrCodeData,
          },
        });
        break;
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

    if (!signup) {
      return NextResponse.json(
        { error: "Could not generate a unique pass ID. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signup: {
        uniqueId: signup.uniqueId,
        qrCodeData: signup.qrCodeData,
        fullName: signup.fullName,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
