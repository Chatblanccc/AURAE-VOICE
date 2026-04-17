import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the AURAE VOICE privacy policy covering data collection, usage, retention, and user controls.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        We collect only the information needed to provide and improve AURAE
        VOICE. We do not sell your personal data.
      </p>

      <section className="mt-10 space-y-8">
        <article>
          <h2 className="text-2xl font-medium">Information we collect</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            We collect account details, usage logs, and conversation metadata to
            deliver product features, maintain security, and support billing.
          </p>
        </article>
        <article>
          <h2 className="text-2xl font-medium">How we use information</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Data is used to run voice features, improve quality, prevent abuse,
            and provide customer support. Access is restricted to authorized
            personnel and service providers.
          </p>
        </article>
        <article>
          <h2 className="text-2xl font-medium">Your controls</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            You can request data export or deletion through support channels.
            Account and subscription settings remain available in the product.
          </p>
        </article>
      </section>
    </main>
  );
}
