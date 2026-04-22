"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type BlurTextProps = {
  className?: string;
  delay?: number;
  direction?: "bottom" | "top";
  splitBy?: "word" | "letter";
  text: string;
};

export function BlurText({
  className,
  delay = 200,
  direction = "bottom",
  splitBy = "word",
  text,
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);
  const [isVisible, setIsVisible] = useState(shouldReduceMotion);

  const tokens = useMemo(() => {
    if (splitBy === "letter") {
      return Array.from(text);
    }

    return text.split(" ");
  }, [splitBy, text]);

  useEffect(() => {
    const node = ref.current;

    if (!node || shouldReduceMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  const yOffset = direction === "bottom" ? 50 : -50;
  const overshoot = direction === "bottom" ? -5 : 5;

  return (
    <span ref={ref} className={className}>
      {tokens.map((token, index) => {
        const shouldAppendSpace = splitBy === "word" && index < tokens.length - 1;
        const key = `${token}-${index}`;

        return (
          <motion.span
            key={key}
            className="inline-block whitespace-pre"
            initial={{
              filter: "blur(10px)",
              opacity: 0,
              y: yOffset,
            }}
            animate={
              isVisible || shouldReduceMotion
                ? {
                    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                    opacity: [0, 0.5, 1],
                    y: [yOffset, overshoot, 0],
                  }
                : undefined
            }
            transition={{
              delay: (delay / 1000) * index,
              duration: prefersReducedMotion ? 0.01 : 0.7,
              ease: "easeOut",
              times: [0, 0.5, 1],
            }}
          >
            {token}
            {shouldAppendSpace ? " " : ""}
          </motion.span>
        );
      })}
    </span>
  );
}
