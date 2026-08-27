"use client";

import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logo} aria-label="Shopify Design">
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
      </a>

      <div className={styles.ctaGroup}>
        <a href="#" className={styles.marqueePill} aria-label="Demo Night Vol. 2">
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

        <a href="#" className={styles.arrowCircle} aria-label="Open event" data-layout="shape" data-id="header-cta" data-depth="100">
          <img src="/icons/arrow-outward.svg" alt="" width="20" height="20" />
        </a>
      </div>
    </header>
  );
}
