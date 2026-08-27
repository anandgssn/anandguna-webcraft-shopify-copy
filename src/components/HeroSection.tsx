"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./HeroSection.module.css";

interface ProjectCard {
  name: string;
  aspect: "landscape" | "portrait" | "square";
  image: string;
  video: string;
  gradient: string;
  depth: number;
}

const CDN = "https://cdn.shopify.com/shopify-design-cms-media/media";

const COL1: ProjectCard[] = [
  { name: "Basket", aspect: "square", image: `${CDN}/Screenshot%202026-05-14%20at%202.32.11%E2%80%AFPM-750x749.png`, video: `${CDN}/d6e0634e_baskets-flare.optimized.mp4`, gradient: "#fff", depth: -533 },
  { name: "Tinker", aspect: "landscape", image: `${CDN}/Screenshot%202026-05-14%20at%202.30.01%E2%80%AFPM-750x697.png`, video: `${CDN}/c4ce944e_tinker_green_background.mov`, gradient: "#fff", depth: -372 },
  { name: "Renaissance", aspect: "landscape", image: `${CDN}/hero-renaissance-midposter-750x619.jpg`, video: `${CDN}/f0b176459b1f4b70944c29b2ee1199f2.HD-1080p-7.2Mbps-79589571.optimized.mp4`, gradient: "#1a1a2e", depth: -545 },
  { name: "Shopify Racing", aspect: "landscape", image: `${CDN}/hero-racing-midposter-750x619.jpg`, video: `${CDN}/b4aa3c14ebaa4f9ab37581d4eff2c821.HD-1080p-3.3Mbps-79589311.optimized.mp4`, gradient: "#0a1628", depth: -510 },
  { name: "Artifact Identity", aspect: "landscape", image: `${CDN}/1b358e5079a74f4da68611480133e0cc.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/1b358e5079a74f4da68611480133e0cc.HD-1080p-7.2Mbps-79589195.optimized.mp4`, gradient: "#1a1a2e", depth: -442 },
  { name: "Visual Search", aspect: "portrait", image: `${CDN}/6eb7750f700b4aa495c1f760437f4172.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/6eb7750f700b4aa495c1f760437f4172.HD-1080p-7.2Mbps-79590119.optimized.mp4`, gradient: "#e8e0d4", depth: -456 },
  { name: "Agentic Search", aspect: "portrait", image: `${CDN}/f8b96401d22446258a24e5f84e64483c.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/f8b96401d22446258a24e5f84e64483c.HD-1080p-4.8Mbps-79590303.optimized.mp4`, gradient: "#1a0a2e", depth: -542 },
  { name: "Shopify Design Logo Animation", aspect: "landscape", image: `${CDN}/c827080fa2e342879c8c88510702444d.thumbnail.0000000000-750x618.jpg`, video: `${CDN}/c827080fa2e342879c8c88510702444d.HD-720p-1.6Mbps-80144075.mp4`, gradient: "#0a0a0a", depth: -533 },
];

const COL2: ProjectCard[] = [
  { name: "Markets Graph", aspect: "landscape", image: `${CDN}/Screenshot%202026-05-14%20at%202.32.48%E2%80%AFPM-750x459.png`, video: `${CDN}/markets2.mp4`, gradient: "#fff", depth: -518 },
  { name: "Shop Week", aspect: "portrait", image: `${CDN}/Screenshot%202026-05-14%20at%2012.56.36%E2%80%AFPM-750x1307.png`, video: `${CDN}/6b11e08a_post03-reel-flowers-260326.mp4`, gradient: "#fff", depth: -386 },
  { name: "Sidekick", aspect: "landscape", image: `${CDN}/7e77055da5174bdbb4a1f623f333ae36.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/7e77055da5174bdbb4a1f623f333ae36.HD-1080p-3.3Mbps-79589500.optimized.mp4`, gradient: "#f5f0e8", depth: -340 },
  { name: "Tinker 2", aspect: "landscape", image: `${CDN}/437622b036d94878a2ee612cdc37b62d.thumbnail.0000000000-750x618.jpg`, video: `${CDN}/437622b036d94878a2ee612cdc37b62d.HD-720p-1.6Mbps-79636459.optimized.mp4`, gradient: "#f7e6ff", depth: -548 },
  { name: "Send Money", aspect: "portrait", image: `${CDN}/1d8d21f862c04e0eb0ca98c045d72f99.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/1d8d21f862c04e0eb0ca98c045d72f99.HD-1080p-7.2Mbps-79590710.optimized.mp4`, gradient: "#f5f0e8", depth: -521 },
  { name: "Text Strings", aspect: "landscape", image: `${CDN}/33aeeb20a9ba491fb89c825ef449c70c.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/33aeeb20a9ba491fb89c825ef449c70c.HD-1080p-7.2Mbps-79934039.optimized.mp4`, gradient: "#f0ebe4", depth: -548 },
  { name: "Carousel", aspect: "portrait", image: `${CDN}/d54d0068dcc34872b2c0763d3f4e321f.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/d54d0068dcc34872b2c0763d3f4e321f.HD-1080p-7.2Mbps-79590542.optimized.mp4`, gradient: "#1a1a2e", depth: -407 },
];

const COL3: ProjectCard[] = [
  { name: "Start Page Hero", aspect: "square", image: `${CDN}/Screenshot%202026-05-14%20at%202.33.40%E2%80%AFPM-750x734.png`, video: `${CDN}/fa87356e_startpage-hero-mobile-loop-eng.optimized.mp4`, gradient: "#fff", depth: -451 },
  { name: "Onboarding Graphic", aspect: "square", image: `${CDN}/Screenshot%202026-05-14%20at%2012.40.04%E2%80%AFPM-750x736.png`, video: `${CDN}/hover.mov`, gradient: "#fff", depth: -509 },
  { name: "Immersive Search", aspect: "portrait", image: `${CDN}/1d2e7cf086874ef38ad6724985a7c250.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/1d2e7cf086874ef38ad6724985a7c250.HD-1080p-7.2Mbps-79931307.optimized.mp4`, gradient: "#1a0a2e", depth: -436 },
  { name: "Shop App Card Stacks", aspect: "portrait", image: `${CDN}/d26134546b0f4bd096ff696d4cbac166.thumbnail.0000000000-750x1275.jpg`, video: `${CDN}/d26134546b0f4bd096ff696d4cbac166.HD-1080p-3.3Mbps-79590167.optimized.mp4`, gradient: "#f5f0e8", depth: -456 },
  { name: "Card Sorting", aspect: "landscape", image: `${CDN}/562007d0b67b419fa723e5f6ebc68c39.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/562007d0b67b419fa723e5f6ebc68c39.HD-1080p-7.2Mbps-79953585.optimized.mp4`, gradient: "#f5f0e8", depth: -409 },
  { name: "OpenAI Integration", aspect: "landscape", image: `${CDN}/hero-open-ai-integration-midposter-750x619.jpg`, video: "", gradient: "#0f0c29", depth: -476 },
  { name: "Shop Web", aspect: "landscape", image: `${CDN}/62468346d8124b80bbf09bf694fd0693.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/62468346d8124b80bbf09bf694fd0693.HD-1080p-7.2Mbps-79590598.optimized-1.mp4`, gradient: "#f5f0e8", depth: -501 },
  { name: "Type Pill", aspect: "landscape", image: `${CDN}/555ec3e877ac4dd3a02a4e145daff3e5.thumbnail.0000000000-750x619.jpg`, video: `${CDN}/555ec3e877ac4dd3a02a4e145daff3e5.HD-1080p-7.2Mbps-80132543.optimized.mp4`, gradient: "#f0ebe4", depth: -472 },
];

const COLUMNS = [COL1, COL2, COL3];

function HeroCard({ card, index, colIdx, cardIdx, onCardClick }: { card: ProjectCard; index: number; colIdx: number; cardIdx: number; onCardClick?: (card: ProjectCard) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cardDelay = 2 + colIdx * 0.06 + cardIdx * 0.2;
  const cardX = (colIdx - 1) * 350;
  const cardY = 300 + cardIdx * 100;
  const cardDur = 1.5 + ((colIdx * 7 + cardIdx * 13) % 4) * 0.2;

  const aspectClass = card.aspect === "portrait"
    ? styles.cardPortrait
    : card.aspect === "square"
    ? styles.cardSquare
    : styles.cardLandscape;

  return (
    <button
      ref={cardRef}
      className={styles.card}
      type="button"
      aria-label={card.name}
      onClick={() => onCardClick?.(card)}
      style={{
        "--hero-card-delay": `${cardDelay}s`,
        "--card-x": `${cardX}px`,
        "--card-y": `${cardY}px`,
        "--card-dur": `${cardDur}s`,
      } as CSSProperties}
      data-layout="video"
      data-id={`hero-card-${index}`}
      data-depth={card.depth}
    >
      <div
        className={`${styles.cardInner} ${aspectClass}`}
        style={{ backgroundColor: card.gradient }}
      >
        {card.video ? (
          <video
            ref={videoRef}
            className={styles.cardVideo}
            muted
            loop
            playsInline
            preload="none"
            poster={card.image}
          >
            <source src={card.video} type="video/mp4" />
          </video>
        ) : (
          <img
            className={styles.cardVideo}
            src={card.image}
            alt={card.name}
            loading="lazy"
          />
        )}
      </div>
    </button>
  );
}

export default function HeroSection({
  onHeadlineClick,
  onCardClick,
}: {
  onHeadlineClick?: () => void;
  onCardClick?: (card: { name: string; video: string; image: string }) => void;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.headlineWrapper}>
        <h1
          className={styles.headline}
          onClick={onHeadlineClick}
          style={{ cursor: "grab" }}
        >
          <span className={styles.headlineLine} data-layout="text" data-id="hero-line-1" data-depth="-200">
            <span className={styles.wordReveal} data-shape="square" style={{ "--wr-delay": "0s", "--wr-drift-dir": "-1" } as CSSProperties}>Make</span>
            {" "}
            <span className={styles.wordReveal} data-shape="circle" style={{ "--wr-delay": "0.12s", "--wr-drift-dir": "1" } as CSSProperties}>the</span>
          </span>
          <span className={styles.headlineLine} data-layout="text" data-id="hero-line-2" data-depth="-200">
            <span className={styles.wordReveal} data-shape="circle" style={{ "--wr-delay": "0.24s", "--wr-drift-dir": "-1" } as CSSProperties}>new</span>
            {" "}
            <span className={styles.wordReveal} data-shape="square" style={{ "--wr-delay": "0.36s", "--wr-drift-dir": "1" } as CSSProperties}>normal</span>
          </span>
        </h1>
        <p className={styles.tagline} data-layout="text" data-id="hero-tagline" data-depth="-300">
          How we work is changing shape. So is what&rsquo;s possible.
        </p>
      </div>

      <div className={styles.liveBar} data-layout="shape" data-id="hero-live" data-depth="-300">
        <div className={styles.liveLeft}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={styles.liveLabel}>LIVE</span>
        </div>
        <div className={styles.liveLine} aria-hidden="true" />
        <div className={styles.liveRight}>
          <span className={styles.artifactText}>FROM ARTIFACT</span>
          <span className={styles.artifactLogo} aria-hidden="true">
            <svg width="28" height="29" viewBox="0 0 28 29" fill="none">
              <rect width="28" height="28.6" rx="8" fill="#091114" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.73 8.16c.41-.29.97-.19 1.26.22l6.35 9.07c.29.41.19.97-.22 1.26l-2.47 1.73c-.41.29-.98.19-1.26-.22l-6.35-9.07c-.29-.41-.19-.97.22-1.26l2.47-1.73zm-2.41 6.72c1.56 0 2.82 1.26 2.82 2.82s-1.26 2.82-2.82 2.82-2.82-1.26-2.82-2.82 1.26-2.82 2.82-2.82z"
                fill="white"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.grid}>
          {COLUMNS.map((col, colIdx) => (
            <div className={styles.column} key={colIdx}>
              {col.map((card, cardIdx) => (
                <HeroCard key={`${colIdx}-${cardIdx}`} card={card} index={colIdx * 10 + cardIdx} colIdx={colIdx} cardIdx={cardIdx} onCardClick={onCardClick} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
