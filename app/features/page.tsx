import type { Metadata } from "next";
import Link from "next/link";
import { featurePages } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "AI Voice Features",
  description:
    "Explore AURAE VOICE features including emotional AI TTS, dynamic voice agents, multilingual voice over workflows, and low-latency voice APIs.",
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">
        AI Voice Generator Features for Real Products
      </h1>
      <p className="mt-4 max-w-3xl text-base text-muted-foreground">
        Discover how AURAE VOICE supports natural text-to-speech generation and
        production-ready voice agent workflows.
      </p>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        {featurePages.map((feature) => (
          <article
            key={feature.slug}
            className="rounded-2xl border bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-medium">{feature.shortTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {feature.description}
            </p>
            <Link
              href={`/features/${feature.slug}`}
              className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Learn more
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
