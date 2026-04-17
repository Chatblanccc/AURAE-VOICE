import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the AURAE VOICE terms of service, acceptable use, billing terms, and liability limitations.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        By using AURAE VOICE, you agree to these terms governing access,
        billing, acceptable use, and service availability.
      </p>

      <section className="mt-10 space-y-8">
        <article>
          <h2 className="text-2xl font-medium">Acceptable use</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            You must use the service lawfully and may not misuse voice tools for
            fraud, impersonation, or prohibited content.
          </p>
        </article>
        <article>
          <h2 className="text-2xl font-medium">Billing and subscriptions</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Paid plans renew based on your selected billing cycle. You can
            manage or cancel subscriptions from your account.
          </p>
        </article>
        <article>
          <h2 className="text-2xl font-medium">Service updates</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            We may update features and terms as the platform evolves. Material
            updates will be published on this page.
          </p>
        </article>
      </section>
    </main>
  );
}
