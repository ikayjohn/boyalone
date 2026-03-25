import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

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
  title: "Omah Lay — Clarity of Mind | Listening Sessions",
  description:
    "An exclusive listening experience for Omah Lay's album Clarity of Mind. Register for upcoming sessions in Lagos and explore past events in Berlin, Paris, and Ischgl.",
  keywords: [
    "Omah Lay",
    "Clarity of Mind",
    "listening session",
    "Lagos",
    "Afrobeats",
    "album",
    "exclusive event",
  ],
  openGraph: {
    title: "Omah Lay — Clarity of Mind Listening Sessions",
    description:
      "An exclusive listening experience for Clarity of Mind. Register now.",
    type: "website",
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
