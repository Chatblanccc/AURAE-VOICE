"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type HlsBackgroundVideoProps = {
  className?: string;
  poster?: string;
  src: string;
};

export function HlsBackgroundVideo({
  className,
  poster,
  src,
}: HlsBackgroundVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;

    if (!video) {
      return;
    }

    let hls: Hls | null = null;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      tryPlay();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        autoStartLoad: true,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
    } else {
      video.src = src;
      tryPlay();
    }

    return () => {
      if (hls) {
        hls.destroy();
      } else {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src]);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      poster={poster}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
