import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "AI Voice Use Cases",
  description:
    "Explore AI voice use cases for e-commerce support, tutorial video automation, game production, and natural TTS quality improvement.",
  alternates: {
    canonical: "/use-cases",
  },
};

export default function UseCasesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">
        AI Voice Use Cases for Product Teams
      </h1>
      <p className="mt-4 max-w-3xl text-base text-muted-foreground">
        Learn how teams apply AI voice generation and conversational audio
        systems in real-world workflows.
      </p>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        {blogPosts.map((post) => (
          <article key={post.slug} className="rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-medium">{post.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {post.description}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View use case
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
