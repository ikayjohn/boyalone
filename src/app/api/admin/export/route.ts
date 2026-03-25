import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signups = await prisma.signup.findMany({
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Signups");

    sheet.columns = [
      { header: "Unique ID", key: "uniqueId", width: 18 },
      { header: "Full Name", key: "fullName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "City", key: "city", width: 18 },
      { header: "Instagram", key: "instagram", width: 20 },
      { header: "Referral Source", key: "referralSource", width: 18 },
      { header: "Session City", key: "sessionCity", width: 18 },
      { header: "Checked In", key: "checkedIn", width: 12 },
      { header: "Registered At", key: "createdAt", width: 22 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };

    for (const signup of signups) {
      sheet.addRow({
        uniqueId: signup.uniqueId,
        fullName: signup.fullName,
        email: signup.email,
        phone: signup.phone,
        city: signup.city,
        instagram: signup.instagram || "",
        referralSource: signup.referralSource || "",
        sessionCity: signup.session.city,
        checkedIn: signup.checkedIn ? "Yes" : "No",
        createdAt: signup.createdAt.toISOString(),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="boyalone-signups-${Date.now()}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to export signups" },
      { status: 500 }
    );
  }
}
