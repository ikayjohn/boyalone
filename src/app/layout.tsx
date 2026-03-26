import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://boyalone.vercel.app";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Omah Lay — Clarity of Mind | Listening Sessions",
  description:
    "Register for Omah Lay's Spirit Warehouse Session in Lagos, an exclusive Clarity of Mind listening experience with tattoos, body piercing, Q&A, and the official album release.",
  keywords: [
    "Omah Lay",
    "Clarity of Mind",
    "Spirit Warehouse Session",
    "Omah Lay Lagos",
    "listening session Lagos",
    "Lagos",
    "Afrobeats",
    "album",
    "exclusive event",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Omah Lay — Spirit Warehouse Session, Lagos",
    description:
      "Register for Omah Lay's exclusive Spirit Warehouse Session in Lagos for Clarity of Mind.",
    type: "website",
    url: "/",
    siteName: "boy alone",
    images: [
      {
        url: "/omah.jpg",
        width: 1200,
        height: 630,
        alt: "Omah Lay — Spirit Warehouse Session, Lagos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Omah Lay — Spirit Warehouse Session, Lagos",
    description:
      "Register for Omah Lay's exclusive Spirit Warehouse Session in Lagos for Clarity of Mind.",
    images: ["/omah.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#F5F0EB]">
        {children}
      </body>
    </html>
  );
}
