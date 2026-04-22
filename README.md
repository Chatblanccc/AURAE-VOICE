# AURAE VOICE

AURAE VOICE is a Next.js 16 application for AI voice products. It combines a multilingual marketing site with an authenticated voice chat workspace, vocabulary review, weekly learning reports, billing, and voice/TTS integrations.

The repo name is still `AI-English-Tutor`, but the current product and codebase have moved beyond the original English tutor prototype. The live app now centers on voice UX, conversational practice flows, account management, and subscription-ready infrastructure.

## What is in the app

- Marketing landing page for `AURAE VOICE` with bilingual copy, SEO metadata, structured data, pricing, FAQ, testimonials, and custom scroll-driven motion.
- Authenticated chat workspace at `/chat` powered by the app's voice interface.
- Vocabulary review workspace at `/vocab` with spaced-repetition style ratings, card creation, editing, and due-card review.
- Weekly learning report page at `/reports`.
- Sign-in flow at `/sign-in` using Auth.js with Google and optional WeChat OAuth.
- Billing endpoints and portal integration through Stripe.
- API routes for chat, TTS, progress, weekly reports, vocab review, scenarios, conversations, usage, and Stripe webhooks.

## Current stack

| Area | Tech |
| --- | --- |
| Framework | Next.js 16 App Router |
| Runtime | React 19 + TypeScript |
| Styling | Tailwind CSS 4 + custom global design tokens |
| Auth | Auth.js / NextAuth v5 beta |
| Database | Neon Postgres (`@neondatabase/serverless`) |
| AI SDK | Vercel AI SDK + `@ai-sdk/openai` |
| LLM provider | Moonshot / Kimi API |
| Voice / TTS | Fish Audio API + browser voice features where applicable |
| Billing | Stripe subscriptions + customer portal |
| State | Zustand |

## Main product areas

### Landing experience

The homepage in [app/page.tsx](D:\english-tutor-assistant\app\page.tsx) is a full marketing site composed from:

- [HeroSection.tsx](D:\english-tutor-assistant\components\landing\HeroSection.tsx)
- [FeaturesSection.tsx](D:\english-tutor-assistant\components\landing\FeaturesSection.tsx)
- [HowItWorksSection.tsx](D:\english-tutor-assistant\components\landing\HowItWorksSection.tsx)
- [TestimonialsSection.tsx](D:\english-tutor-assistant\components\landing\TestimonialsSection.tsx)
- [PricingSection.tsx](D:\english-tutor-assistant\components\landing\PricingSection.tsx)
- [FaqSection.tsx](D:\english-tutor-assistant\components\landing\FaqSection.tsx)
- [FinalCtaSection.tsx](D:\english-tutor-assistant\components\landing\FinalCtaSection.tsx)

It also includes custom motion and pinned-step interactions through [LandingScrollEffects.tsx](D:\english-tutor-assistant\components\landing\LandingScrollEffects.tsx).

### Authenticated experience

- `/chat`: voice-first conversation workspace.
- `/vocab`: personal vocabulary card management and review.
- `/reports`: weekly report dashboard.
- `/features`, `/use-cases`, `/blog`, `/terms`, `/privacy`: supporting product and content pages.

## Local development

### Requirements

- Node.js 20+ recommended
- npm
- A Neon Postgres database
- A Moonshot / Kimi API key

Optional integrations:

- Google OAuth credentials
- WeChat OAuth credentials
- Fish Audio API key
- Stripe test keys and price IDs

### Install

```bash
git clone https://github.com/Chatblanccc/AI-English-Tutor.git
cd AI-English-Tutor
npm install
```

### Configure environment

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

At minimum, fill these values:

```env
AUTH_SECRET=your_auth_secret
AUTH_URL=http://localhost:3000

AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

KIMI_API_KEY=your_moonshot_api_key
KIMI_API_URL=https://api.moonshot.cn/v1

DATABASE_URL=your_neon_database_url
```

Optional but supported in the current codebase:

```env
FISH_AUDIO_API_KEY=your_fish_audio_api_key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

NEXT_PUBLIC_SITE_URL=https://your-domain.com

WECHAT_CLIENT_ID=your_wechat_client_id
WECHAT_CLIENT_SECRET=your_wechat_client_secret
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validate

```bash
npm run lint
```

### Production build

```bash
npm run build
npm run start
```

## Project layout

```text
app/
  api/                 Route handlers for chat, auth, reports, vocab, Stripe, TTS, and usage
  blog/                Blog pages
  chat/                Voice chat page
  features/            Product feature pages
  privacy/             Privacy page
  reports/             Weekly report page
  sign-in/             Custom sign-in page
  terms/               Terms page
  use-cases/           Use-case pages
  vocab/               Vocabulary review page

components/
  landing/             Marketing site sections and landing interactions
  ui/                  Shared UI primitives
  VoiceInterface.tsx   Main authenticated voice/chat UI

lib/
  db.ts                Neon database helpers and schema utilities
  landing-i18n.ts      Landing-page copy in multiple languages
  stripe.ts            Stripe helpers
  site.ts              Canonical site metadata
  tutor-agent.ts       Tutor / chat related logic

store/
  ...                  Zustand stores

auth.ts                Auth.js configuration
next.config.ts         Next.js config
```

## Notes for contributors

- This repo uses a newer Next.js version. Read the internal docs under `node_modules/next/dist/docs/` before making framework-level assumptions.
- The homepage is heavily customized and should be treated as a designed marketing surface, not a generic Tailwind landing page.
- The authentication layer uses provider account IDs as stable user IDs.
- Stripe subscription flows are already scaffolded in the API routes and env config.
- The README is now aligned to the current `AURAE VOICE` app, not the older SpeakStar prototype.

## License

MIT
