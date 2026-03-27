export interface SiteContentPayload {
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroAccent: string;
  heroSubtitle: string;
  heroVideoUrl: string;
  presaveUrl: string;
}

export const DEFAULT_SITE_CONTENT: SiteContentPayload = {
  heroLine1: "Spirit",
  heroLine2: "Warehouse",
  heroLine3: "Session,",
  heroAccent: "Lagos",
  heroSubtitle:
    "An exclusive listening experience for Clarity of Mind, curated in the spirit of Lagos.",
  heroVideoUrl: "/hero1.mp4",
  presaveUrl: "https://keyqaad.lnk.to/ClarityOfMind",
};

export function normalizeSiteContent(
  content?: Partial<SiteContentPayload> | null
): SiteContentPayload {
  return {
    heroLine1: content?.heroLine1?.trim() || DEFAULT_SITE_CONTENT.heroLine1,
    heroLine2: content?.heroLine2?.trim() || DEFAULT_SITE_CONTENT.heroLine2,
    heroLine3: content?.heroLine3?.trim() || DEFAULT_SITE_CONTENT.heroLine3,
    heroAccent: content?.heroAccent?.trim() || DEFAULT_SITE_CONTENT.heroAccent,
    heroSubtitle:
      content?.heroSubtitle?.trim() || DEFAULT_SITE_CONTENT.heroSubtitle,
    heroVideoUrl:
      content?.heroVideoUrl?.trim() || DEFAULT_SITE_CONTENT.heroVideoUrl,
    presaveUrl: content?.presaveUrl?.trim() || DEFAULT_SITE_CONTENT.presaveUrl,
  };
}
