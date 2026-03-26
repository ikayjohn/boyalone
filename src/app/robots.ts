import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://boyalone.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/admin/", "/verify/", "/preview/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
