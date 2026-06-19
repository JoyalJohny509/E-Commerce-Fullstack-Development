'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import styles from '../page.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [isClearing, setIsClearing] = useState(true);
  const { clearCartLocal } = useCartStore();

  useEffect(() => {
    // Clear the local cart state since the webhook handles server-side cart clearing
    clearCartLocal();
    setIsClearing(false);
  }, [clearCartLocal]);

  if (isClearing) {
    return (
      <div className={styles.confirmation}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Processing your order...</p>
      </div>
    );
  }

  return (
    <div className={styles.confirmation}>
      <div className={styles.confirmIcon}>✓</div>
      <h1 className={styles.confirmTitle}>Payment Successful!</h1>
      <p className={styles.confirmDesc}>
        Thank you for your purchase! Your payment has been processed securely via Stripe.
        {orderId && (
          <>
            {' '}Your order <strong>{orderId}</strong> is being prepared.
          </>
        )}
        {' '}You&apos;ll receive an email confirmation shortly.
      </p>
      <div className={styles.confirmActions}>
        <Link href="/orders" className="btn btn-primary btn-lg" id="view-orders-success">
          View My Orders
        </Link>
        <Link href="/shop" className="btn btn-secondary btn-lg" id="continue-shopping-success">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Suspense
          fallback={
            <div className={styles.confirmation}>
              <div className="spinner" style={{ width: 40, height: 40 }} />
              <p>Loading...</p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
