'use client';

import type Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

type HlsVideoProps = {
  src: string;
  hlsSrc?: string;
  poster?: string;
};

export function HlsVideo({ src, hlsSrc, poster }: HlsVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShouldRenderVideo(entry.isIntersecting);
      },
      { rootMargin: '0px', threshold: 0.01 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!shouldRenderVideo || !video) {
      return undefined;
    }

    const playVideo = () => {
      void video.play().catch(() => {
        // Browsers may still block autoplay in some modes; controls remain visible.
      });
    };
    const fallbackToMp4 = () => {
      if (video.src !== src) {
        video.src = src;
      }
      video.addEventListener('loadedmetadata', playVideo, { once: true });
    };

    if (!hlsSrc) {
      fallbackToMp4();
      return () => video.removeEventListener('loadedmetadata', playVideo);
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc;
      video.addEventListener('loadedmetadata', playVideo, { once: true });
      video.addEventListener('error', fallbackToMp4, { once: true });
      return () => {
        video.pause();
        video.removeEventListener('loadedmetadata', playVideo);
        video.removeEventListener('error', fallbackToMp4);
      };
    }

    let isMounted = true;
    let hls: Hls | null = null;

    void import('hls.js').then(({ default: Hls }) => {
      if (!isMounted || !video) {
        return;
      }

      if (!Hls.isSupported()) {
        fallbackToMp4();
        return;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        startLevel: 0,
      });

      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls?.destroy();
          hls = null;
          fallbackToMp4();
        }
      });
    });

    return () => {
      isMounted = false;
      video.pause();
      hls?.destroy();
    };
  }, [hlsSrc, shouldRenderVideo, src]);

  return (
    <div ref={containerRef} className="hls-video-shell">
      {shouldRenderVideo ? (
        <video
          ref={videoRef}
          poster={poster}
          autoPlay={false}
          controls
          loop
          muted
          preload="metadata"
          playsInline
        />
      ) : poster ? (
        <img src={poster} alt="" loading="lazy" decoding="async" />
      ) : null}
    </div>
  );
}
