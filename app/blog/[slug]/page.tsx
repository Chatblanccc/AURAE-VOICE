import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/seo-content";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

function getPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
      </nav>

      <h1 className="text-4xl font-semibold tracking-tight">{post.h1}</h1>
      <p className="mt-4 text-sm text-muted-foreground">{post.date}</p>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {post.description}
      </p>

      <div className="mt-10 space-y-8">
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-medium">{section.heading}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
