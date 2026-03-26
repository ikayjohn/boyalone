import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://boyalone.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
