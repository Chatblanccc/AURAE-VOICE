import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { LandingPageClient } from "@/components/homepage/LandingPageClient";

const BRAND_NAME = "AURAE VOICE";

export const metadata: Metadata = {
  title: "AURAE VOICE | AI English Tutor & Speaking Practice",
  description:
    "AURAE VOICE helps you practice spoken English with an AI tutor, real-time feedback, and structured learning paths for daily conversation, exams, and interviews.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AURAE VOICE | AI English Tutor & Speaking Practice",
    description:
      "Practice real English conversations, get instant feedback, and improve fluency with AI-powered lessons.",
    url: SITE_URL,
    type: "website",
  },
};

export default function Page() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    description:
      "An AI English tutor platform for speaking practice, vocabulary building, and personalized learning reports.",
    inLanguage: "en",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-icon.svg`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
