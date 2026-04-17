const fallbackUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

function normalizeSiteUrl(rawUrl: string): string {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  return `https://${rawUrl}`;
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackUrl
);

export const SITE_NAME = "AURAE VOICE";
export const DEFAULT_OG_IMAGE = "/og-default.svg";
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION;
