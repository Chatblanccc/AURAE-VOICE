export type FeaturePage = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
};

export const featurePages: FeaturePage[] = [
  {
    slug: "emotional-ai-voice-synthesis",
    title: "Emotional AI Voice Synthesis",
    shortTitle: "Emotional AI TTS",
    description:
      "Generate expressive speech with emotion-aware AI text-to-speech voices that sound human across support, media, and product experiences.",
    h1: "Emotional AI Voice Synthesis",
    intro:
      "Create speech that sounds less robotic with emotion-aware voice rendering tuned for natural pacing, tone, and delivery.",
    bullets: [
      "Emotion-aware style controls for calm, energetic, and empathetic delivery.",
      "Consistent speaker identity across long scripts and multi-turn interactions.",
      "High-quality output for media production, in-app narration, and onboarding flows.",
    ],
  },
  {
    slug: "dynamic-voice-ai-agent",
    title: "Dynamic Voice AI Agent",
    shortTitle: "Dynamic Voice Agent",
    description:
      "Build voice agents that switch style and persona in real time to match conversation context, customer intent, and language preference.",
    h1: "Dynamic Voice AI Agent",
    intro:
      "Deploy adaptive voice agents that can change speaking style and response strategy in real time while keeping conversations natural.",
    bullets: [
      "Voice behavior that adapts to user intent and conversation stage.",
      "Built for customer support, onboarding, and guided task completion flows.",
      "Maintains latency targets for fast, conversational turn-taking.",
    ],
  },
  {
    slug: "multilingual-online-voice-over-tool",
    title: "Multilingual Online Voice Over Tool",
    shortTitle: "Multilingual Voice Over",
    description:
      "Produce multilingual AI voice overs from one workflow for global content teams, product tutorials, and marketing launches.",
    h1: "Multilingual Online Voice Over Tool",
    intro:
      "Create polished multilingual voice overs quickly, with consistent tone and timing across languages for global campaigns.",
    bullets: [
      "Single workflow for script preparation, voice generation, and revision.",
      "Consistent delivery style across English-first and localized content.",
      "Designed for tutorial videos, product explainers, and launch assets.",
    ],
  },
  {
    slug: "low-latency-conversational-voice-api",
    title: "Low-Latency Conversational Voice API",
    shortTitle: "Low-Latency Voice API",
    description:
      "Integrate a low-latency conversational voice API for browser-based voice assistants, in-product copilots, and support automation.",
    h1: "Low-Latency Conversational Voice API",
    intro:
      "Ship responsive browser voice interactions with an API designed for real-time turn-taking and production reliability.",
    bullets: [
      "Low-latency streaming responses for conversational interaction loops.",
      "Built for browser clients and server-side orchestration workflows.",
      "Clear integration path for support assistants and AI voice copilots.",
    ],
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  h1: string;
  sections: Array<{ heading: string; body: string }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-make-ai-voice-sound-less-robotic",
    title: "How to Make AI Voice Sound Less Robotic",
    description:
      "Practical techniques to improve pacing, prosody, and script structure so AI voice output sounds natural and engaging.",
    date: "2026-04-17",
    h1: "How to Make AI Voice Sound Less Robotic",
    sections: [
      {
        heading: "Start with script quality, not only model settings",
        body: "Most robotic output starts with unnatural copy. Write short conversational sentences, include pauses, and remove repetitive phrasing before synthesis.",
      },
      {
        heading: "Tune speaking style to context",
        body: "Match speaking style to user intent. Support flows should prioritize clarity and calm pacing, while promotional content can use more energetic delivery.",
      },
      {
        heading: "Evaluate with real listeners",
        body: "Run listening tests with target users and compare completion rate, comprehension, and trust. Quality wins when voice style supports the task.",
      },
    ],
  },
  {
    slug: "ai-voice-customer-service-for-ecommerce",
    title: "AI Voice Customer Service for E-Commerce",
    description:
      "A practical architecture for deploying AI voice customer service in e-commerce, from intent routing to escalation workflows.",
    date: "2026-04-17",
    h1: "AI Voice Customer Service for E-Commerce",
    sections: [
      {
        heading: "Prioritize high-volume support intents",
        body: "Start with shipment updates, returns, and order status. These flows are structured and benefit most from voice automation.",
      },
      {
        heading: "Design safe escalation paths",
        body: "Always provide fast handoff to human support for payment disputes, policy exceptions, and emotional conversations.",
      },
      {
        heading: "Measure outcomes by resolution and satisfaction",
        body: "Track first-contact resolution, average handling time, and CSAT to validate that voice automation improves both speed and experience.",
      },
    ],
  },
  {
    slug: "ai-voice-acting-for-3d-animation-and-games",
    title: "AI Voice Acting for 3D Animation and Games",
    description:
      "Use AI voice acting workflows to accelerate prototyping and iteration for 3D animation projects and independent game production.",
    date: "2026-04-17",
    h1: "AI Voice Acting for 3D Animation and Games",
    sections: [
      {
        heading: "Use AI for rapid script iteration",
        body: "During pre-production, AI voices help teams test pacing, scene timing, and emotional tone before final recording decisions.",
      },
      {
        heading: "Separate prototype and final production tracks",
        body: "Keep asset governance clear. Teams can use AI in previews while planning final production and rights-safe release workflows.",
      },
      {
        heading: "Align voice style with character design",
        body: "Define voice profiles that match character archetypes and narrative moments to keep gameplay and story delivery consistent.",
      },
    ],
  },
  {
    slug: "automated-ai-voice-for-tutorial-videos",
    title: "Automated AI Voice for Tutorial Videos",
    description:
      "Create tutorial video narration pipelines with AI voice automation, multilingual variants, and consistent output quality.",
    date: "2026-04-17",
    h1: "Automated AI Voice for Tutorial Videos",
    sections: [
      {
        heading: "Build a repeatable narration workflow",
        body: "Standardize script templates and generation steps so your team can create voice-over assets quickly for each release cycle.",
      },
      {
        heading: "Localize once, publish many variants",
        body: "Use multilingual generation to produce region-specific tutorial versions while keeping tone, structure, and pacing aligned.",
      },
      {
        heading: "Continuously improve with playback analytics",
        body: "Monitor audience retention and replay points to find where narration clarity can improve in future tutorials.",
      },
    ],
  },
];
