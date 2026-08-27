"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./CarouselSection.module.css";

/* ------------------------------------------------------------------ */
/*  Card data                                                         */
/* ------------------------------------------------------------------ */

type CardVariant = "media" | "stacked" | "article";

interface CardData {
  bg: string;
  fg: string;
  footerFg: string;
  leftLabel: string;
  rightLabel: string;
  variant: CardVariant;
  bgText?: string;
  articleHeading?: string;
  rotation: number;
  image?: string;
  video?: string;
  stackedImages?: [string, string, string];
}

const CDN = "https://cdn.shopify.com/shopify-design-cms-media/media";

const CARDS: CardData[] = [
  {
    bg: "#1c3b36",
    fg: "#6bff91",
    footerFg: "#fff",
    leftLabel: "Dive Club",
    rightLabel: "Katarina Batina",
    variant: "media",
    bgText: "Dive Club",
    rotation: -1.5,
    image: `${CDN}/Comp%201%20(0-00-01-17)-400x500.jpg`,
    video: `${CDN}/katarina-dive-club-d.mp4`,
  },
  {
    bg: "#b8c4db",
    fg: "#4f2730",
    footerFg: "#000",
    leftLabel: "design.md",
    rightLabel: "APR 2026",
    variant: "stacked",
    rotation: 2,
    stackedImages: [
      `${CDN}/Design%20dot%20MD%20-%20April%202026-71-400x600.jpg`,
      `${CDN}/Design%20dot%20MD%20-%20April%202026-99-400x267.jpg`,
      `${CDN}/Design%20dot%20MD%20-%20April%202026-129-400x267.jpg`,
    ],
  },
  {
    bg: "#dfd5cb",
    fg: "#fe432a",
    footerFg: "#000",
    leftLabel: "Play",
    rightLabel: "We won a Webby! / 2026",
    variant: "media",
    bgText: "Play",
    rotation: -1,
    image: `${CDN}/Screenshot%202026-05-14%20at%2011.36.01%E2%80%AFAM-400x385.png`,
    video: `${CDN}/73288b47_6940c05bdde89526865776-1.mp4`,
  },
  {
    bg: "#b8c4db",
    fg: "#4f2730",
    footerFg: "#000",
    leftLabel: "Demo Night",
    rightLabel: "APR 2026",
    variant: "stacked",
    rotation: 1.8,
    stackedImages: [
      `${CDN}/FullSizeRender_VSCO%205-400x711.jpg`,
      `${CDN}/FullSizeRender_VSCO%206-400x711.jpg`,
      `${CDN}/Demo%20Night%20April%202026-6-400x267.jpg`,
    ],
  },
  {
    bg: "#0225ac",
    fg: "#ffaac7",
    footerFg: "#fff",
    leftLabel: "Product Design Studio",
    rightLabel: "April 2026",
    variant: "article",
    articleHeading: "Building Artifact",
    rotation: -2.2,
    image: "/images/carousel/article-bg-1.png",
  },
  {
    bg: "#1c3b36",
    fg: "#6bff91",
    footerFg: "#fff",
    leftLabel: "Sneak Peek",
    rightLabel: "Kazden Cattapan",
    variant: "media",
    bgText: "Sneak Peek",
    rotation: 1.2,
    image: `${CDN}/ff4a6e5701ad4a04a6cc08467aa91f98.thumbnail.0000000000-400x471.jpg`,
    video: `${CDN}/ff4a6e5701ad4a04a6cc08467aa91f98.HD-1080p-7.2Mbps-80133154.mp4`,
  },
  {
    bg: "#b8c4db",
    fg: "#4f2730",
    footerFg: "#000",
    leftLabel: "Demo Night",
    rightLabel: "Nov 2025",
    variant: "stacked",
    rotation: -2,
    stackedImages: [
      `${CDN}/demo-4-400x545.jpg`,
      `${CDN}/demo-2-400x400.jpg`,
      `${CDN}/demo-5-400x399.jpg`,
    ],
  },
  {
    bg: "#dfd5cb",
    fg: "#fe432a",
    footerFg: "#000",
    leftLabel: "Dive Club",
    rightLabel: "Marvin Schwaibold",
    variant: "media",
    bgText: "Dive Club",
    rotation: 2.5,
    image: `${CDN}/55800eaa392d4221b566228ad4738c12.thumbnail.0000000000-400x500.jpg`,
    video: `${CDN}/55800eaa392d4221b566228ad4738c12.HD-1080p-2.5Mbps-79811256.mp4`,
  },
  {
    bg: "#1c3b36",
    fg: "#6bff91",
    footerFg: "#fff",
    leftLabel: "Context",
    rightLabel: "Carl Rivera",
    variant: "media",
    bgText: "Context",
    rotation: -1.3,
    image: `${CDN}/e19a9e24eed7476284e1de8c6a3c769f.thumbnail.0000000000-400x500.jpg`,
    video: `${CDN}/e19a9e24eed7476284e1de8c6a3c769f.HD-1080p-2.5Mbps-79551703.mp4`,
  },
  {
    bg: "#ffaac7",
    fg: "#fe432a",
    footerFg: "#000",
    leftLabel: "Carl Rivera",
    rightLabel: "Nov 2025",
    variant: "article",
    articleHeading: "Deciding to move faster",
    rotation: 1.6,
    image: "/images/carousel/article-bg-2.png",
  },
  {
    bg: "#4f2730",
    fg: "#ffaac7",
    footerFg: "#fff",
    leftLabel: "Double Diamond",
    rightLabel: "Carl Rivera",
    variant: "media",
    bgText: "Diamond",
    rotation: -1.5,
    image: `${CDN}/2cfdb1d8f8d444aea59813a3e268b23f.thumbnail.0000000000-400x500.jpg`,
    video: `${CDN}/2cfdb1d8f8d444aea59813a3e268b23f.HD-1080p-2.5Mbps-79551308.mp4`,
  },
  {
    bg: "#dfd5cb",
    fg: "#1c3b36",
    footerFg: "#000",
    leftLabel: "Kinference and Friends",
    rightLabel: "Dinner",
    variant: "stacked",
    rotation: 2,
    stackedImages: [
      `${CDN}/kinference-1-400x267.jpg`,
      `${CDN}/carousel-5444c9789cd9-400x400.png`,
      `${CDN}/kinference-2_ce084f22-3011-47e0-bf7c-1f02f0579275-400x316.jpg`,
    ],
  },
  {
    bg: "#fe432a",
    fg: "#ffaac7",
    footerFg: "#fff",
    leftLabel: "Kinference",
    rightLabel: "Carl Rivera",
    variant: "media",
    bgText: "Kinference",
    rotation: -1.3,
    image: `${CDN}/38c4940ce38c44459008d2f7b4e36849.thumbnail.0000000000-400x500.jpg`,
    video: `${CDN}/38c4940ce38c44459008d2f7b4e36849.HD-1080p-4.8Mbps-79387049.mp4`,
  },
  {
    bg: "#b8c4db",
    fg: "#4f2730",
    footerFg: "#000",
    leftLabel: "Product Design Studio",
    rightLabel: "EOY Gathering",
    variant: "stacked",
    rotation: 1.6,
    stackedImages: [
      `${CDN}/dinner-14-400x267.jpg`,
      `${CDN}/dinner-7_23130f8c-7bd6-4c2c-8d4f-25a1699e8928-400x300.jpg`,
      `${CDN}/dinner-1_8c7d9d7b-9ecc-4e59-9bb2-b02d918ebc06-400x300.jpg`,
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components for card variants                                   */
/* ------------------------------------------------------------------ */

function MediaCardContent({ card }: { card: CardData }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <span className={styles.bgText} style={{ color: card.fg }}>
        {card.bgText}
      </span>

      <div className={styles.mediaFrame}>
        {card.video ? (
          <video
            ref={videoRef}
            className={styles.mediaImage}
            muted
            loop
            playsInline
            preload="metadata"
            poster={card.image}
          >
            <source src={card.video} type="video/mp4" />
          </video>
        ) : card.image ? (
          <img
            className={styles.mediaImage}
            src={card.image}
            alt={card.leftLabel}
            loading="lazy"
          />
        ) : (
          <div
            className={styles.mediaPlaceholder}
            style={{
              background: `linear-gradient(135deg, ${card.fg}44 0%, ${card.fg}22 100%)`,
            }}
          />
        )}
      </div>

      <div className={styles.playLabel} style={{ color: card.fg }}>
        <span className={styles.playTriangle} />
        Play
      </div>
    </div>
  );
}

function StackedCardContent({ card }: { card: CardData }) {
  const shades = [`${card.fg}cc`, `${card.fg}99`, `${card.fg}66`];

  return (
    <div className={styles.stackedContainer}>
      {card.stackedImages
        ? card.stackedImages.map((src, i) => (
            <img
              key={i}
              className={styles.stackedImage}
              src={src}
              alt={`${card.leftLabel} ${i + 1}`}
              loading="lazy"
            />
          ))
        : shades.map((shade, i) => (
            <div
              key={i}
              className={styles.stackedImage}
              style={{
                background: `linear-gradient(135deg, ${shade} 0%, ${card.fg}33 100%)`,
              }}
            />
          ))}
    </div>
  );
}

function ArticleCardContent({ card }: { card: CardData }) {
  return (
    <>
      {/* Background image with dark gradient overlay */}
      {card.image ? (
        <div className={styles.articleBg}>
          <img
            className={styles.articleBgImage}
            src={card.image}
            alt={card.articleHeading || card.leftLabel}
            loading="lazy"
          />
          <div className={styles.articleBgOverlay} />
        </div>
      ) : (
        <div
          className={styles.articleBg}
          style={{
            background: `linear-gradient(180deg, ${card.bg} 0%, ${card.fg}33 100%)`,
          }}
        />
      )}

      {/* Heading */}
      <h3 className={styles.articleHeading} style={{ color: card.fg }}>{card.articleHeading}</h3>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CarouselSection({ onCardClick }: { onCardClick?: (card: { name: string; video: string; image: string }) => void }) {
  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    containScroll: false,
    align: "center",
    loop: false,
  });
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when section top hits bottom of viewport, 1 when section top hits top
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      // Translate from right (positive) to left as user scrolls down
      const maxShift = track!.scrollWidth - window.innerWidth + 200;
      const shift = (1 - progress) * Math.min(maxShift, 800);
      track!.style.transform = `translateX(${shift}px)`;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- Render ---- */

  return (
    <section id="stories" className={styles.section} ref={sectionRef}>
      {/* Headline */}
      <div className={styles.headlineWrap}>
        <h2 className={styles.headline}>
          <span data-layout="text" data-id="carousel-headline" data-depth="220">Design</span>
          <br />
          <span data-layout="text" data-id="carousel-headline-2" data-depth="220">in public</span>
        </h2>
        <p className={styles.tagline}>
          Ideas and conversations shaping how we design at Shopify.
        </p>
      </div>

      {/* Carousel — Embla viewport */}
      <div ref={emblaRef} className={styles.carouselViewport}>
        <div className={styles.carousel} ref={trackRef}>
          {CARDS.map((card, i) => (
            <button
              key={i}
              className={styles.card}
              style={
                {
                  backgroundColor: card.bg,
                  "--card-rotation": `${card.rotation}deg`,
                } as React.CSSProperties
              }
              onClick={() => {
                if (card.video && onCardClick) {
                  onCardClick({ name: card.leftLabel, video: card.video, image: card.image || "" });
                }
              }}
              aria-label={`${card.leftLabel} -- ${card.rightLabel}`}
              data-layout="image"
              data-id={`carousel-card-${i}`}
              data-depth={-i * 20}
            >
              <div className={styles.cardInner}>
                {card.variant === "media" && <MediaCardContent card={card} />}
                {card.variant === "stacked" && (
                  <StackedCardContent card={card} />
                )}
                {card.variant === "article" && (
                  <ArticleCardContent card={card} />
                )}
              </div>

              <div
                className={styles.cardFooter}
                style={{ color: card.footerFg }}
              >
                <span>{card.leftLabel}</span>
                <span>{card.rightLabel}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
