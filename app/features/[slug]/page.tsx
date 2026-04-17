import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featurePages } from "@/lib/seo-content";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

function getFeature(slug: string) {
  return featurePages.find((feature) => feature.slug === slug);
}

export async function generateStaticParams() {
  return featurePages.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeature(slug);

  if (!feature) {
    return {};
  }

  return {
    title: feature.title,
    description: feature.description,
    alternates: {
      canonical: `/features/${feature.slug}`,
    },
  };
}

export default async function FeatureDetailPage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeature(slug);

  if (!feature) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/features" className="hover:underline">
          Features
        </Link>
        <span className="mx-2">/</span>
        <span>{feature.shortTitle}</span>
      </nav>

      <h1 className="text-4xl font-semibold tracking-tight">{feature.h1}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {feature.intro}
      </p>

      <section className="mt-10 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-medium">What this feature helps you ship</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-medium">See the full platform in action</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Test AURAE VOICE with your own scripts, response flows, and
          multilingual scenarios to validate voice quality and latency targets.
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Start free
        </Link>
      </section>
    </main>
  );
}
