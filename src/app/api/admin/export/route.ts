import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSignupWhereClause } from "@/lib/signup-filters";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const format = request.nextUrl.searchParams.get("format") ?? "xlsx";
    const where = buildSignupWhereClause({
      search: request.nextUrl.searchParams.get("search") || "",
      sessionCityCode: request.nextUrl.searchParams.get("session") || "",
      checkedIn: request.nextUrl.searchParams.get("checkedIn"),
      bodyArtPreference:
        request.nextUrl.searchParams.get("bodyArtPreference") || "",
      utmSource: request.nextUrl.searchParams.get("utmSource") || "",
    });
    const signups = await prisma.signup.findMany({
      where,
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });

    const exportRows = signups.map((signup) => ({
      uniqueId: signup.uniqueId,
      fullName: signup.fullName,
      email: signup.email,
      phone: signup.phone,
      city: signup.city,
      instagram: signup.instagram || "",
      xUsername: signup.xUsername || "",
      tiktokUsername: signup.tiktokUsername || "",
      bodyArtPreference: signup.bodyArtPreference || "",
      sessionCity: signup.session.city,
      utmSource: signup.utmSource || "",
      checkedIn: signup.checkedIn ? "Yes" : "No",
      createdAt: signup.createdAt.toISOString(),
    }));

    if (format === "csv") {
      const headers = [
        "Unique ID",
        "Full Name",
        "Email",
        "Phone",
        "City",
        "Instagram",
        "X",
        "TikTok",
        "Body Art Preference",
        "Session City",
        "Source",
        "Checked In",
        "Registered At",
      ];

      const rows = exportRows.map((row) =>
        [
          row.uniqueId,
          row.fullName,
          row.email,
          row.phone,
          row.city,
          row.instagram,
          row.xUsername,
          row.tiktokUsername,
          row.bodyArtPreference,
          row.sessionCity,
          row.utmSource,
          row.checkedIn,
          row.createdAt,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      );

      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="boyalone-signups-${Date.now()}.csv"`,
        },
      });
    }

    if (format === "json") {
      return NextResponse.json(exportRows, {
        headers: {
          "Content-Disposition": `attachment; filename="boyalone-signups-${Date.now()}.json"`,
        },
      });
    }

    if (format === "pdf") {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
      });
      const chunks: Buffer[] = [];

      const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      const drawHeader = () => {
        doc.fontSize(16).font("Helvetica-Bold").text("boy alone signups");
        doc
          .moveDown(0.2)
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown(0.8);
        doc.fillColor("#000000");
      };

      const rowHeight = 18;
      const columns = [
        { label: "ID", key: "uniqueId", width: 90 },
        { label: "Name", key: "fullName", width: 110 },
        { label: "Email", key: "email", width: 140 },
        { label: "Phone", key: "phone", width: 80 },
        { label: "Session", key: "sessionCity", width: 65 },
        { label: "Art", key: "bodyArtPreference", width: 55 },
        { label: "Source", key: "utmSource", width: 70 },
      ] as const;

      const drawTableHeader = (y: number) => {
        let x = doc.page.margins.left;
        doc.font("Helvetica-Bold").fontSize(8);
        for (const column of columns) {
          doc.text(column.label, x, y, {
            width: column.width,
            ellipsis: true,
          });
          x += column.width;
        }
        doc
          .moveTo(doc.page.margins.left, y + 12)
          .lineTo(doc.page.width - doc.page.margins.right, y + 12)
          .strokeColor("#cccccc")
          .stroke();
        doc.font("Helvetica").strokeColor("#000000");
      };

      drawHeader();
      let y = doc.y;
      drawTableHeader(y);
      y += rowHeight;

      for (const row of exportRows) {
        if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
          doc.addPage();
          drawHeader();
          y = doc.y;
          drawTableHeader(y);
          y += rowHeight;
        }

        let x = doc.page.margins.left;
        doc.fontSize(8).font("Helvetica");
        for (const column of columns) {
          const value = row[column.key] || "—";
          doc.text(String(value), x, y, {
            width: column.width,
            ellipsis: true,
          });
          x += column.width;
        }

        y += rowHeight;
      }

      doc.end();
      const buffer = await pdfBufferPromise;
      const body = new Uint8Array(buffer);

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="boyalone-signups-${Date.now()}.pdf"`,
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Signups");

    sheet.columns = [
      { header: "Unique ID", key: "uniqueId", width: 18 },
      { header: "Full Name", key: "fullName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "City", key: "city", width: 18 },
      { header: "Instagram", key: "instagram", width: 20 },
      { header: "X", key: "xUsername", width: 20 },
      { header: "TikTok", key: "tiktokUsername", width: 20 },
      { header: "Body Art Preference", key: "bodyArtPreference", width: 22 },
      { header: "Session City", key: "sessionCity", width: 18 },
      { header: "Source", key: "utmSource", width: 18 },
      { header: "Checked In", key: "checkedIn", width: 12 },
      { header: "Registered At", key: "createdAt", width: 22 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };

    for (const row of exportRows) {
      sheet.addRow(row);
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
