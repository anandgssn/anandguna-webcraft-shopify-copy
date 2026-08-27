"use client";

import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="Shopify Design">
        <img
          src="/icons/logo.svg"
          alt="Shopify Design"
          className={styles.logoIcon}
          width="121"
          height="34"
          data-layout="image"
          data-id="header-logo"
          data-depth="-300"
        />
      </Link>

      <div className={styles.ctaGroup}>
        <a href="#stories" className={styles.marqueePill} aria-label="Jump to Demo Night stories">
          <div className={styles.marqueeWindow}>
            <div className={styles.marqueeTrack}>
              <span className={styles.marqueeText}>
                Demo Night Vol. 2&nbsp;&nbsp;&middot;&nbsp;&nbsp;Demo Night Vol.
                2&nbsp;&nbsp;&middot;&nbsp;&nbsp;
              </span>
              <span className={styles.marqueeText} aria-hidden="true">
                Demo Night Vol. 2&nbsp;&nbsp;&middot;&nbsp;&nbsp;Demo Night Vol.
                2&nbsp;&nbsp;&middot;&nbsp;&nbsp;
              </span>
            </div>
          </div>
          <img
            src="/icons/marquee-icon.gif"
            alt=""
            className={styles.marqueeIcon}
            width="24"
            height="24"
          />
          <span className={styles.dateLabel}>Apr 22</span>
        </a>

        <a href="#stories" className={styles.arrowCircle} aria-label="Jump to stories" data-layout="shape" data-id="header-cta" data-depth="100">
          <img src="/icons/arrow-outward.svg" alt="" width="20" height="20" />
        </a>
      </div>
    </header>
  );
}
