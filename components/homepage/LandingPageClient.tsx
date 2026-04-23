"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  LogOut,
  MessageSquare,
  Palette,
  Play,
  ReceiptText,
  Shield,
  Zap,
} from "lucide-react";
import { BlurText } from "@/components/homepage/BlurText";
import { HlsBackgroundVideo } from "@/components/homepage/HlsBackgroundVideo";
import { AuraeLogoIcon } from "@/components/AuraeLogo";
import { useLanguageStore } from "@/store/useLanguageStore";
import type { UserPlan } from "@/types";
import { cn } from "@/lib/utils";

const heroVideoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4";

const startSectionVideoUrl =
  "https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8";

const statsSectionVideoUrl =
  "https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8";

const footerVideoUrl =
  "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

const navItems = [
  { href: "#home", key: "home" },
  { href: "#services", key: "features" },
  { href: "#work", key: "scenarios" },
  { href: "#process", key: "howItWorks" },
  { href: "#pricing", key: "pricing" },
] as const;

const partnersByLang = {
  en: [
    "Daily Conversation",
    "IELTS Prep",
    "Interview English",
    "Travel English",
    "Business English",
  ],
  zh: ["日常口语", "雅思备考", "面试英语", "旅行英语", "商务英语"],
} as const;

const whyUsItemsByLang = {
  en: [
    {
      body: "Talk naturally with an AI tutor and get immediate guidance on pronunciation, grammar, and fluency.",
      icon: Zap,
      title: "Real-Time Speaking Feedback",
    },
    {
      body: "Choose role-play sessions for interviews, exams, workplace communication, or everyday life.",
      icon: Palette,
      title: "Scenario-Based Practice",
    },
    {
      body: "Build long-term retention with review cards generated from your actual conversations.",
      icon: BarChart3,
      title: "Vocabulary That Sticks",
    },
    {
      body: "Track speaking minutes, weekly reports, and progress trends so every session has direction.",
      icon: Shield,
      title: "Progress You Can Measure",
    },
  ],
  zh: [
    {
      body: "像真实对话一样练口语，每一轮都能拿到发音、语法和表达流畅度反馈。",
      icon: Zap,
      title: "实时口语反馈",
    },
    {
      body: "支持面试、考试、职场沟通、生活交流等多种角色扮演训练场景。",
      icon: Palette,
      title: "场景化练习",
    },
    {
      body: "把你的真实对话自动生成复习卡片，让词汇记得住、用得出。",
      icon: BarChart3,
      title: "高效词汇巩固",
    },
    {
      body: "追踪口语时长、周报和成长趋势，让每次练习都有明确目标。",
      icon: Shield,
      title: "可量化的进步",
    },
  ],
} as const;

const statsByLang = {
  en: [
    { label: "Practice sessions completed", value: "18k+" },
    { label: "Average weekly speaking time", value: "42 min" },
    { label: "Learners reporting confidence gain", value: "91%" },
    { label: "Supported learning scenarios", value: "30+" },
  ],
  zh: [
    { label: "累计练习会话", value: "18k+" },
    { label: "人均每周口语时长", value: "42 分钟" },
    { label: "反馈口语自信提升", value: "91%" },
    { label: "覆盖学习场景", value: "30+" },
  ],
} as const;

const testimonialsByLang = {
  en: [
    {
      name: "Lina Zhao",
      quote:
        "I used to freeze in meetings. After two weeks of daily role-play, I can explain my ideas in English without panic.",
      role: "Product Manager",
    },
    {
      name: "Daniel Kim",
      quote:
        "The interview simulator felt close to real pressure. It helped me structure answers clearly and speak much more naturally.",
      role: "Software Engineer",
    },
    {
      name: "Mia Torres",
      quote:
        "The vocab cards from my own mistakes are a game changer. I finally remember words when I actually need them.",
      role: "Graduate Student",
    },
  ],
  zh: [
    {
      name: "Lina Zhao",
      quote:
        "我以前在英文会议里总是卡住。连续两周角色扮演练习后，我已经能更从容地表达观点。",
      role: "产品经理",
    },
    {
      name: "Daniel Kim",
      quote:
        "面试模拟非常接近真实压力场景，帮助我把回答结构化，口语表达也自然了很多。",
      role: "软件工程师",
    },
    {
      name: "Mia Torres",
      quote:
        "系统把我常犯错自动做成词汇卡片，这个功能太实用了，终于能在需要时说出来。",
      role: "研究生",
    },
  ],
} as const;

const motionEnter = {
  animate: {
    filter: "blur(0px)",
    opacity: 1,
    y: 0,
  },
  initial: {
    filter: "blur(10px)",
    opacity: 0,
    y: 20,
  },
};

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="liquid-glass inline-flex rounded-full px-3.5 py-1 text-xs font-medium text-white font-body">
      {children}
    </span>
  );
}

function PillLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const isHash = href.startsWith("#");

  if (isHash) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 rounded-full text-sm transition",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-sm transition",
        className,
      )}
    >
      {children}
    </a>
  );
}

function PrimaryGlassLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <PillLink
      href={href}
      className="liquid-glass-strong px-5 py-2.5 font-body font-medium text-white hover:bg-white/10"
    >
      {children}
    </PillLink>
  );
}

function WhitePillLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <PillLink
      href={href}
      className="rounded-full bg-white px-6 py-3 font-body text-sm font-medium text-black hover:bg-white/90"
    >
      {children}
    </PillLink>
  );
}

function SectionIntro({
  badge,
  titleClassName,
  title,
}: {
  badge: string;
  titleClassName?: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
      <SectionBadge>{badge}</SectionBadge>
      <h2
        className={cn(
          "text-4xl font-heading italic leading-[0.9] tracking-tight text-white md:text-5xl lg:text-6xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
    </div>
  );
}

function SectionVideoFrame({
  children,
  desaturated = false,
  id,
  minHeightClassName,
  videoSrc,
}: {
  children: React.ReactNode;
  desaturated?: boolean;
  id?: string;
  minHeightClassName?: string;
  videoSrc: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden bg-black px-6 py-24 md:px-8 lg:px-16",
        minHeightClassName,
      )}
    >
      <HlsBackgroundVideo
        src={videoSrc}
        className={cn(desaturated && "saturate-0")}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktopNavExpanded, setIsDesktopNavExpanded] = useState(true);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const wasScrolledRef = useRef(false);
  const { data: session, status } = useSession();
  const { lang, toggleLang } = useLanguageStore();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    (lang === "zh" ? "学习者" : "Learner");
  const userInitial = userName.slice(0, 1).toUpperCase();
  const userImage = session?.user?.image;
  const tx =
    lang === "zh"
      ? {
          home: "首页",
          features: "功能",
          scenarios: "场景",
          howItWorks: "如何使用",
          pricing: "价格",
          chat: "对话",
          vocab: "词汇",
          reports: "报告",
          signIn: "登录",
          startFree: "免费开始",
          goToChat: "进入对话",
          goToVocab: "进入词汇",
          goToReports: "查看报告",
          signOut: "退出登录",
          menu: "菜单",
          startPractice: "开始练习",
        }
      : {
          home: "Home",
          features: "Features",
          scenarios: "Scenarios",
          howItWorks: "How It Works",
          pricing: "Pricing",
          chat: "Chat",
          vocab: "Vocab",
          reports: "Reports",
          signIn: "Sign in",
          startFree: "Start Free",
          goToChat: "Go to Chat",
          goToVocab: "Go to Vocab",
          goToReports: "View Reports",
          signOut: "Sign out",
          menu: "Menu",
          startPractice: "Start Practice",
        };
  const isDesktopNavCollapsed = isScrolled && !isDesktopNavExpanded;

  useEffect(() => {
    const onScroll = () => {
      const nextScrolled = window.scrollY > 24;
      setIsScrolled(nextScrolled);

      if (nextScrolled !== wasScrolledRef.current) {
        setIsDesktopNavExpanded(!nextScrolled);
        setMenuOpen(false);
        setUserMenuOpen(false);
        wasScrolledRef.current = nextScrolled;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-4 z-50 px-8 py-3 lg:px-16">
      <div
        className={cn(
          "pointer-events-auto relative flex w-full items-center rounded-xl px-2 py-1 transition-all duration-300",
          isScrolled &&
            "border border-white/15 bg-black/35 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-lg",
          isDesktopNavCollapsed && "md:w-fit",
        )}
      >
        {isScrolled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_40%,rgba(255,255,255,0.01)_100%)]"
          />
        )}
        <Link
          href="#home"
          aria-label="AURAE VOICE home"
          className={cn("flex items-center gap-2.5", isDesktopNavCollapsed && "md:hidden")}
        >
          <AuraeLogoIcon size={48} color="#C96442" className="h-12 w-12 shrink-0" />
          <span className="hidden text-sm font-semibold tracking-wide text-white/95 sm:inline md:text-base">
            AURAE VOICE
          </span>
        </Link>

        {isDesktopNavCollapsed && (
          <button
            type="button"
            className="hidden items-center justify-center text-white md:inline-flex"
            aria-controls="desktop-primary-navigation"
            aria-expanded={false}
            aria-label="Expand navigation"
            onClick={() => setIsDesktopNavExpanded(true)}
          >
            <AuraeLogoIcon size={48} color="#C96442" className="h-12 w-12 shrink-0" />
          </button>
        )}

        <div
          id="desktop-primary-navigation"
          hidden={isDesktopNavCollapsed}
          className="absolute left-1/2 hidden -translate-x-1/2 justify-center md:flex"
        >
          <nav className="liquid-glass rounded-full px-1.5 py-1">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white font-body"
                  >
                    {tx[item.key]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black"
                >
                  {lang === "zh" ? "开始体验" : "Get Started"}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div
          hidden={isDesktopNavCollapsed}
          className="ml-auto hidden items-center gap-2 md:flex"
        >
          <button
            type="button"
            onClick={toggleLang}
            className="liquid-glass rounded-full px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white"
            aria-label="Toggle language"
          >
            {lang === "en" ? "中文" : "EN"}
          </button>

          {status === "loading" ? (
            <span className="px-3 text-xs text-white/70">...</span>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black"
              >
                {tx.startPractice}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="liquid-glass flex items-center gap-2 rounded-full px-2 py-1 text-white"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Open account menu"
                >
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                      {userInitial}
                    </span>
                  )}
                  <span className="max-w-[92px] truncate pr-1 text-xs">{userName}</span>
                </button>

                {userMenuOpen && (
                  <div className="liquid-glass absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl p-1.5">
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {tx.goToChat}
                    </Link>
                    <Link
                      href="/vocab"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {tx.goToVocab}
                    </Link>
                    <Link
                      href="/reports"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ReceiptText className="h-3.5 w-3.5" />
                      {tx.goToReports}
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/75 hover:bg-white/10"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {tx.signOut}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-2 py-2 text-sm font-medium text-white/85 hover:text-white"
              >
                {tx.signIn}
              </Link>
              <Link
                href="/sign-in?callbackUrl=%2Fchat"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black"
              >
                {tx.startFree}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="liquid-glass rounded-full px-3 py-2 text-xs font-medium text-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {tx.menu}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="pointer-events-auto ml-auto mt-3 w-full max-w-xs rounded-2xl bg-black/80 p-4 backdrop-blur md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {tx[item.key]}
              </Link>
            ))}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={toggleLang}
              className="mb-2 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              {lang === "en" ? "切换到中文" : "Switch to English"}
            </button>
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/chat"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {tx.chat}
                </Link>
                <Link
                  href="/vocab"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  {tx.vocab}
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <ReceiptText className="h-4 w-4" />
                  {tx.reports}
                </Link>
                <button
                  type="button"
                  className="mt-1 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  {tx.signOut}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  {tx.signIn}
                </Link>
                <Link
                  href="/sign-in?callbackUrl=%2Fchat"
                  className="rounded-lg bg-white px-3 py-2 text-center text-sm font-medium text-black"
                  onClick={() => setMenuOpen(false)}
                >
                  {tx.startFree}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSection() {
  const { data: session, status } = useSession();
  const { lang } = useLanguageStore();
  const heroBlurVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroMainVideoRef = useRef<HTMLVideoElement | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const hasMemberPlan = userPlan === "plus" || userPlan === "pro";

  useEffect(() => {
    const fetchPlan = async () => {
      if (!isLoggedIn) {
        setUserPlan(null);
        return;
      }
      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
        if (!res.ok) {
          setUserPlan("free");
          return;
        }
        const data = (await res.json()) as { plan?: UserPlan };
        const plan = data.plan;
        setUserPlan(plan === "free" || plan === "plus" || plan === "pro" ? plan : "free");
      } catch {
        setUserPlan("free");
      }
    };

    void fetchPlan();
  }, [isLoggedIn]);

  const heroPrimaryCta = (() => {
    if (!isLoggedIn) {
      return {
        href: "/sign-in?callbackUrl=%2Fchat",
        label: lang === "zh" ? "登录后开始练习" : "Sign in to Start",
      };
    }
    if (hasMemberPlan) {
      return {
        href: "/chat",
        label: lang === "zh" ? "开始练习" : "Start Practice",
      };
    }
    return {
      href: "#pricing",
      label: lang === "zh" ? "查看会员方案" : "View Membership Plans",
    };
  })();

  const heroCopy =
    lang === "zh"
      ? {
          newTag: "新",
          badgeText: "全新：实时 AI 口语教练",
          ctaSecondary: "查看学习流程",
          heroTitle: "每天自信开口说英语",
          heroBody:
            "用 AI 导师进行真实对话，获得即时反馈，并通过个性化路径持续提升口语流利度。",
          socialProofIntro: "为这些学习目标而打造",
        }
      : {
          newTag: "New",
          badgeText: "New: Real-time AI speaking coach.",
          ctaSecondary: "See Learning Flow",
          heroTitle: "Speak English with Confidence Every Day",
          heroBody:
            "Practice real conversations with an AI tutor, get instant feedback, and build lasting fluency through personalized speaking plans.",
          socialProofIntro: "Built for learners focused on",
        };
  const partners = partnersByLang[lang];

  useEffect(() => {
    const ensurePlayback = () => {
      [heroBlurVideoRef.current, heroMainVideoRef.current].forEach((video) => {
        if (!video) return;
        video.defaultMuted = true;
        video.muted = true;

        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Ignore autoplay rejections and keep UI stable.
          });
        }
      });
    };

    ensurePlayback();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ensurePlayback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative isolate h-[1000px] overflow-visible px-6 md:px-8 lg:px-16"
    >
      <video
        ref={heroBlurVideoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/hero_bg.jpeg"
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full scale-110 object-cover opacity-55 blur-3xl saturate-[0.9]"
      >
        <source src={heroVideoUrl} type="video/mp4" />
      </video>
      <video
        ref={heroMainVideoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/hero_bg.jpeg"
        aria-hidden="true"
        className="absolute left-0 top-[20%] z-0 h-auto w-full object-contain opacity-90 [mask-image:linear-gradient(to_bottom,transparent_0%,black_16%,black_84%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_16%,black_84%,transparent_100%)]"
      >
        <source src={heroVideoUrl} type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-0 bg-black/5" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[300px] bg-gradient-to-b from-transparent to-black" />

      <div className="relative z-10 flex h-full flex-col items-center px-4 pt-[150px] text-center">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <div className="liquid-glass inline-flex items-center gap-3 rounded-full px-1 py-1 text-xs text-white">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
              {heroCopy.newTag}
            </span>
            <span className="pr-3 font-body text-white/80">
              {heroCopy.badgeText}
            </span>
          </div>

          <h1 className="mt-8 max-w-2xl text-6xl font-heading italic leading-[0.8] tracking-[-4px] text-white md:text-7xl lg:text-[5.5rem]">
            <BlurText text={heroCopy.heroTitle} delay={100} />
          </h1>

          <motion.p
            initial={motionEnter.initial}
            animate={motionEnter.animate}
            transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
            className="mt-6 max-w-xl text-sm font-body font-light leading-tight text-white md:text-base"
          >
            {heroCopy.heroBody}
          </motion.p>

          <motion.div
            initial={motionEnter.initial}
            animate={motionEnter.animate}
            transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryGlassLink href={heroPrimaryCta.href}>
              {heroPrimaryCta.label}
              <ArrowUpRight className="h-4 w-4" />
            </PrimaryGlassLink>

            <PillLink
              href="#process"
              className="px-2 py-2 font-body font-medium text-white hover:text-white/80"
            >
              <Play className="h-4 w-4 fill-current" />
              {heroCopy.ctaSecondary}
            </PillLink>
          </motion.div>
        </div>

        <div className="mt-auto w-full pb-8 pt-16">
          <div className="mx-auto flex flex-col items-center gap-6">
            <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white/80 font-body">
              {heroCopy.socialProofIntro}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
              {partners.map((partner) => (
                <span
                  key={partner}
                  className="text-2xl font-heading italic text-white md:text-3xl"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StartSection() {
  const { lang } = useLanguageStore();
  const copy =
    lang === "zh"
      ? {
          badge: "如何使用",
          title: "你开口，我们辅导，你持续进步。",
          body:
            "几秒内开始一次对话。AURAE VOICE 会实时聆听、回应，并在每轮对话后给出可执行反馈。",
          cta: "开始学习",
        }
      : {
          badge: "How It Works",
          title: "You speak. We coach. You improve.",
          body:
            "Start a conversation in seconds. AURAE VOICE listens, responds, and guides you with actionable feedback after every turn.",
          cta: "Start Learning",
        };
  return (
    <SectionVideoFrame id="process" videoSrc={startSectionVideoUrl} minHeightClassName="min-h-[500px]">
      <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
        <SectionBadge>{copy.badge}</SectionBadge>
        <h2 className="mt-6 max-w-4xl text-4xl font-heading italic leading-[0.9] tracking-tight text-white md:text-5xl lg:text-6xl">
          {copy.title}
        </h2>
        <p className="mt-5 max-w-xl text-sm font-body font-light text-white/60 md:text-base">
          {copy.body}
        </p>
        <div className="mt-8">
          <PrimaryGlassLink href="#pricing">
            {copy.cta}
            <ArrowUpRight className="h-4 w-4" />
          </PrimaryGlassLink>
        </div>
      </div>
    </SectionVideoFrame>
  );
}

function FeaturesChess() {
  const { lang } = useLanguageStore();
  const copy =
    lang === "zh"
      ? {
          introBadge: "学习体验",
          introTitle: "明确进步路径，告别盲目练习。",
          title1: "在真实语境里练习，而不是背孤立句子。",
          body1:
            "覆盖面试、团队沟通、旅行和日常交流等高频场景，让每次练习都贴近真实使用。",
          cta1: "查看练习场景",
          title2: "把反馈变成可执行学习计划。",
          body2:
            "每次会话都会指出下一步重点：发音、语法、词汇和表达结构，并结合周报持续追踪。",
          cta2: "查看进度路径",
          imageAlt1: "场景化英语口语练习预览",
          imageAlt2: "AI 反馈与周报进度预览",
        }
      : {
          introBadge: "Learning Experience",
          introTitle: "Serious progress. Zero guesswork.",
          title1: "Speak with context, not random sentences.",
          body1:
            "Train with practical scenarios like job interviews, team meetings, travel, and daily small talk so your practice matches real life.",
          cta1: "Explore scenarios",
          title2: "Feedback that turns into a study plan.",
          body2:
            "Every session highlights what to fix next: pronunciation, grammar, vocabulary, and response structure, with weekly progress tracking.",
          cta2: "View progress flow",
          imageAlt1: "Scenario-based English speaking practice preview",
          imageAlt2: "AI feedback and weekly progress preview",
        };
  const introTitleClassName =
    lang === "zh"
      ? "whitespace-nowrap text-3xl md:text-4xl lg:text-5xl"
      : undefined;
  const featureTitleClassName =
    lang === "zh" ? "whitespace-nowrap text-2xl md:text-3xl" : undefined;
  return (
    <section id="work" className="bg-black px-6 py-24 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          badge={copy.introBadge}
          title={copy.introTitle}
          titleClassName={introTitleClassName}
        />

        <div className="mt-20 space-y-16">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
            <div className="max-w-xl flex-1">
              <h3
                className={cn(
                  "text-3xl font-heading italic leading-tight text-white md:text-4xl",
                  featureTitleClassName,
                )}
              >
                {copy.title1}
              </h3>
              <p className="mt-5 text-sm font-body font-light leading-7 text-white/65 md:text-base">
                {copy.body1}
              </p>
              <div className="mt-7">
                <PrimaryGlassLink href="#services">
                  {copy.cta1}
                  <ArrowUpRight className="h-4 w-4" />
                </PrimaryGlassLink>
              </div>
            </div>

            <div className="w-full flex-1">
              <div className="liquid-glass overflow-hidden rounded-[8px] p-3">
                <Image
                  src="/images/feature-1.gif"
                  alt={copy.imageAlt1}
                  width={1600}
                  height={1200}
                  className="h-full w-full rounded-[6px] object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row-reverse lg:gap-16">
            <div className="max-w-xl flex-1">
              <h3
                className={cn(
                  "text-3xl font-heading italic leading-tight text-white md:text-4xl",
                  featureTitleClassName,
                )}
              >
                {copy.title2}
              </h3>
              <p className="mt-5 text-sm font-body font-light leading-7 text-white/65 md:text-base">
                {copy.body2}
              </p>
              <div className="mt-7">
                <PrimaryGlassLink href="#process">
                  {copy.cta2}
                  <ArrowUpRight className="h-4 w-4" />
                </PrimaryGlassLink>
              </div>
            </div>

            <div className="w-full flex-1">
              <div className="liquid-glass overflow-hidden rounded-[8px] p-3">
                <Image
                  src="/images/feature-2.gif"
                  alt={copy.imageAlt2}
                  width={1600}
                  height={1200}
                  className="h-full w-full rounded-[6px] object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const { lang } = useLanguageStore();
  const copy =
    lang === "zh"
      ? {
          badge: "为什么选择 AURAE VOICE",
          title: "每一项设计都围绕口语结果展开。",
        }
      : {
          badge: "Why AURAE VOICE",
          title: "Everything is built for speaking outcomes.",
        };
  const introTitleClassName =
    lang === "zh"
      ? "whitespace-nowrap text-3xl md:text-4xl lg:text-5xl"
      : undefined;
  const whyUsItems = whyUsItemsByLang[lang];
  return (
    <section id="services" className="bg-black px-6 py-24 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          badge={copy.badge}
          title={copy.title}
          titleClassName={introTitleClassName}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {whyUsItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="liquid-glass rounded-[8px] p-6">
                <div className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-full">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-6 text-xl font-body font-medium text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-body font-light leading-7 text-white/65">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { lang } = useLanguageStore();
  const stats = statsByLang[lang];
  return (
    <SectionVideoFrame
      videoSrc={statsSectionVideoUrl}
      desaturated
      minHeightClassName="py-28"
    >
      <div className="liquid-glass rounded-md p-12 md:p-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label}>
              <p className="text-4xl font-heading italic text-white md:text-5xl lg:text-6xl">
                {item.value}
              </p>
              <p className="mt-3 text-sm font-body font-light text-white/60">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionVideoFrame>
  );
}

function TestimonialsSection() {
  const { lang } = useLanguageStore();
  const copy =
    lang === "zh"
      ? {
          badge: "学习者反馈",
          title: "几周内就能感受到变化。",
        }
      : {
          badge: "What They Say",
          title: "Learners feel the difference in weeks.",
        };
  const testimonials = testimonialsByLang[lang];
  return (
    <section className="bg-black px-6 py-24 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionIntro badge={copy.badge} title={copy.title} />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="liquid-glass rounded-[8px] p-8">
              <p className="text-sm font-body font-light italic leading-7 text-white/80">
                {item.quote}
              </p>
              <p className="mt-8 text-sm font-body font-medium text-white">
                {item.name}
              </p>
              <p className="mt-1 text-xs font-body font-light text-white/50">
                {item.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const { lang } = useLanguageStore();
  const copy =
    lang === "zh"
      ? {
          title: "从今天开始，自信说出第一段英语对话。",
          body:
            "从一节练习开始，系统会为你生成个性化口语、词汇与流利度提升路径，不再受限于固定课程安排。",
          ctaPrimary: "联系团队",
          ctaSecondary: "查看方案",
          rights: "(c) 2026 AURAE VOICE. 保留所有权利。",
          privacy: "隐私",
          terms: "条款",
          contact: "联系我们",
        }
      : {
          title: "Start your first confident English conversation today.",
          body:
            "Begin with one session and get a personalized path for speaking, vocabulary, and fluency growth. No classroom scheduling required.",
          ctaPrimary: "Talk to Our Team",
          ctaSecondary: "See Plans",
          rights: "(c) 2026 AURAE VOICE. All rights reserved.",
          privacy: "Privacy",
          terms: "Terms",
          contact: "Contact",
        };
  return (
    <SectionVideoFrame
      id="pricing"
      videoSrc={footerVideoUrl}
      minHeightClassName="pt-28"
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="max-w-4xl text-5xl font-heading italic leading-[0.85] text-white md:text-6xl lg:text-7xl">
          {copy.title}
        </h2>
        <p className="mt-6 max-w-2xl text-sm font-body font-light leading-7 text-white/65 md:text-base">
          {copy.body}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <PrimaryGlassLink href="mailto:hello@aurae.ai?subject=Start%20AURAE%20VOICE">
            {copy.ctaPrimary}
            <ArrowUpRight className="h-4 w-4" />
          </PrimaryGlassLink>
          <WhitePillLink href="#pricing">{copy.ctaSecondary}</WhitePillLink>
        </div>

        <div className="mt-32 flex w-full max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>{copy.rights}</p>
          <div className="flex items-center justify-center gap-6">
            <Link href="/privacy">{copy.privacy}</Link>
            <Link href="/terms">{copy.terms}</Link>
            <a href="mailto:hello@aurae.ai">{copy.contact}</a>
          </div>
        </div>
      </div>
    </SectionVideoFrame>
  );
}

export function LandingPageClient() {
  return (
    <div className="homepage-editorial relative overflow-x-clip bg-black font-body text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(121,154,206,0.18),transparent_32%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_24%)]" />

      <Navbar />

      <div className="relative z-10">
        <HeroSection />
        <div className="bg-black">
          <StartSection />
          <FeaturesChess />
          <FeaturesGrid />
          <StatsSection />
          <TestimonialsSection />
          <FooterSection />
        </div>
      </div>
    </div>
  );
}
