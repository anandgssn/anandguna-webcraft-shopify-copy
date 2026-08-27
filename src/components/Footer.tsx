"use client";

import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.topBar}>
        <span className={styles.brandName}>
          Shopify <span className={styles.brandDimmed}>Design</span>
        </span>
        <span className={styles.year}>2026</span>
      </div>

      <hr className={styles.divider} />

      <div className={styles.content}>
        <h2 className={styles.headline} data-layout="text" data-id="footer-headline" data-depth="-300">
          Help shape what
          <br />
          comes next
        </h2>

        <a href="#" className={styles.ctaButton} data-layout="shape" data-id="footer-btn" data-depth="-300" data-shape-type="pill">
          <span className={styles.ctaLabel}>Join Shopify</span>
          <img src="/icons/shop-bag.svg" alt="" width="20" height="20" className={styles.ctaIcon} />
          <span className={styles.ctaSublabel}>Open Roles</span>
        </a>
      </div>
    </footer>
  );
}
