import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGlow} />
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <span className={styles.logoIcon}>◆</span>
              <span className={styles.logoText}>LUXE</span>
            </Link>
            <p className={styles.footerTagline}>
              Premium products for the modern lifestyle. Curated with care, delivered with excellence.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Shop</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/shop?category=electronics">Electronics</Link></li>
              <li><Link href="/shop?category=accessories">Accessories</Link></li>
              <li><Link href="/shop?category=fashion">Fashion</Link></li>
              <li><Link href="/shop">All Products</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Account</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/auth">Sign In</Link></li>
              <li><Link href="/cart">Shopping Cart</Link></li>
              <li><Link href="/orders">Order History</Link></li>
              <li><Link href="#">Wishlist</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Support</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Returns & Exchanges</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} LUXE Store. All rights reserved.
          </p>
          <div className={styles.paymentMethods}>
            <span className={styles.paymentIcon}>💳</span>
            <span className={styles.paymentText}>Visa • Mastercard • PayPal • Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
