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
      bodyArtPreference,
      referralSource,
      agreedToTerms,
    } = body;

    // Validate required fields
    if (!sessionCity || !fullName || !email || !phone || !city) {
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
          equals: email,
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

    // Generate unique ID
    const signupCount = await prisma.signup.count({
      where: { sessionId: session.id },
    });
    const uniqueId = generateUniqueId(session.cityCode, signupCount + 1);

    // Generate QR code
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${uniqueId}`;
    const qrCodeData = await generateQRCode(verifyUrl);

    // Create signup record
    const signup = await prisma.signup.create({
      data: {
        uniqueId,
        sessionId: session.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        instagram: instagram?.trim() || null,
        referralSource: bodyArtPreference || referralSource || null,
        agreedToTerms: true,
        qrCodeData,
      },
    });

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
