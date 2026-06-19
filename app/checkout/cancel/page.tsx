'use client';

import Link from 'next/link';
import styles from '../page.module.css';

export default function CheckoutCancelPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.confirmation}>
          <div className={styles.confirmIcon} style={{ background: 'var(--warning)', color: 'var(--bg-primary)' }}>
            ✕
          </div>
          <h1 className={styles.confirmTitle}>Payment Cancelled</h1>
          <p className={styles.confirmDesc}>
            Your payment was cancelled and you have not been charged.
            Your cart items are still saved — you can try again when you&apos;re ready.
          </p>
          <div className={styles.confirmActions}>
            <Link href="/cart" className="btn btn-primary btn-lg" id="return-to-cart">
              Return to Cart
            </Link>
            <Link href="/shop" className="btn btn-secondary btn-lg" id="continue-shopping-cancel">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
