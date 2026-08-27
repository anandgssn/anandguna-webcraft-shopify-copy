"use client";

import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CountdownSection from "@/components/CountdownSection";
import CarouselSection from "@/components/CarouselSection";
import RemoteSection from "@/components/RemoteSection";
import Footer from "@/components/Footer";
import FloatingCapsule from "@/components/FloatingCapsule";
import ScrollReveal from "@/components/ScrollReveal";
import WebGLScene from "@/components/WebGLScene/WebGLScene";
import IntroScene from "@/components/IntroScene";
import DebugOverlay from "@/components/WebGLScene/DebugOverlay";
import VideoModal from "@/components/VideoModal";

const ALL_CARDS: Record<string, { name: string; video: string; image: string }> = {};

export default function Home() {
  const [webglActive, setWebglActive] = useState(false);
  const [webglLocked, setWebglLocked] = useState(false);
  const [modalVideo, setModalVideo] = useState<{ src: string; poster: string; name: string } | null>(null);

  const openCard = useCallback((card: { name: string; video: string; image: string }) => {
    const slug = card.name.toLowerCase().replace(/\s+/g, "-");
    ALL_CARDS[slug] = card;
    window.history.pushState(null, "", `#hero-${slug}`);
    setModalVideo({ src: card.video, poster: card.image, name: card.name });
  }, []);

  const closeCard = useCallback(() => {
    setModalVideo(null);
    if (window.location.hash.startsWith("#hero-")) {
      window.history.pushState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (!window.location.hash.startsWith("#hero-")) {
        setModalVideo(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleHeadlineDown = useCallback(() => {
    setWebglLocked(true);
    setWebglActive(true);
  }, []);

  const handleMainDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("video") || target.closest("h1")) return;
    setWebglLocked(false);
    setWebglActive(true);
  }, []);

  const handleMouseUpClose = useCallback(() => {
    if (!webglLocked) {
      setWebglActive(false);
    }
  }, [webglLocked]);

  const handleEscClose = useCallback(() => {
    setWebglLocked(false);
    setWebglActive(false);
  }, []);

  const handleCapsuleClick = useCallback(() => {
    setWebglActive((prev) => {
      if (prev) {
        setWebglLocked(false);
        return false;
      } else {
        setWebglLocked(true);
        return true;
      }
    });
  }, []);

  const handleCardClick = useCallback((card: { name: string; video: string; image: string }) => {
    openCard(card);
  }, [openCard]);

  return (
    <>
      <main onMouseDown={handleMainDown} onMouseUp={handleMouseUpClose} style={{ cursor: "grab" }}>
        <Header />
        <HeroSection
          onHeadlineClick={handleHeadlineDown}
          onCardClick={handleCardClick}
        />
        <CountdownSection />
        <ScrollReveal delay={100}>
          <CarouselSection onCardClick={handleCardClick} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <RemoteSection />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <Footer />
        </ScrollReveal>
      </main>
      <FloatingCapsule onClick={handleCapsuleClick} />
      <WebGLScene
        isActive={webglActive}
        onClose={handleMouseUpClose}
        onEscClose={handleEscClose}
        locked={webglLocked}
      />
      <DebugOverlay />
      <IntroScene />
      {modalVideo && (
        <VideoModal
          src={modalVideo.src}
          poster={modalVideo.poster}
          name={modalVideo.name}
          onClose={closeCard}
        />
      )}
    </>
  );
}
