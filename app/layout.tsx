import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AURAE VOICE",
  description: "Your personal AI-powered English speaking coach, powered by AURAE VOICE",
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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Explicit tab icon — some browsers still default to /favicon.ico (see next.config redirects) */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <Script id="aurae-theme-init" strategy="beforeInteractive">
          {`(function(){try{var raw=localStorage.getItem('aurae-theme');if(!raw)return;var d=JSON.parse(raw);var m=d&&d.state&&d.state.mode;if(m==='dark'||m==='light'){document.documentElement.setAttribute('data-theme',m);document.documentElement.classList.toggle('dark',m==='dark');}}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
