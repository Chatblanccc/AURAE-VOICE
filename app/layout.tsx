import type { Metadata } from "next";
import { Barlow, Instrument_Serif } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { AuthEndpointSelfCheck } from "@/components/AuthEndpointSelfCheck";
import {
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const headingFont = Instrument_Serif({
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-heading-google",
  weight: "400",
});

const bodyFont = Barlow({
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-body-google",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | AI Voice Generator, TTS Software, and Voice Agent`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "AURAE VOICE is an AI voice generator and text-to-speech software built for natural, real-time voice conversations, multilingual voice experiences, and production-ready voice agents.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "AI Voice Generator",
    "Text-to-Speech Software",
    "AI Voice Agent",
    "AI Voice Cloning",
    "Low-latency conversational voice API",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} | AI Voice Generator, TTS Software, and Voice Agent`,
    description:
      "Create natural AI voices with low-latency text-to-speech and real-time voice agents built for global products.",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} platform preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | AI Voice Generator`,
    description:
      "Build realistic voice experiences with multilingual AI TTS and low-latency conversational voice agents.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/favicon.svg",
    apple: [{ url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }],
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
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <Script id="aurae-theme-init" strategy="beforeInteractive">
          {`(function(){try{var raw=localStorage.getItem('aurae-theme');if(!raw)return;var d=JSON.parse(raw);var m=d&&d.state&&d.state.mode;if(m==='dark'||m==='light'){document.documentElement.setAttribute('data-theme',m);document.documentElement.classList.toggle('dark',m==='dark');}}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider basePath="/api/auth">
          <AuthEndpointSelfCheck basePath="/api/auth" />
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
