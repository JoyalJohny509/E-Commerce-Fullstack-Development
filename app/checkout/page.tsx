'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, useOrderStore, useAuthStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { ShippingAddress } from '@/lib/types';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const { setShippingAddress } = useOrderStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Shipping form state
  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
  });

  const subtotal = getTotal();
  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className="container">
          <span className={styles.emptyIcon}>🛒</span>
          <h1>Your Cart is Empty</h1>
          <p>Add some items to your cart before checking out.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.emptyState}>
        <div className="container">
          <span className={styles.emptyIcon}>🔒</span>
          <h1>Sign In Required</h1>
          <p>Please sign in or create an account to proceed with checkout.</p>
          <Link href="/auth" className="btn btn-primary btn-lg">
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingAddress(shipping);
    setStep(2);
  };

  const handlePayWithStripe = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: shipping }),
      });

      const data = await res.json();

      if (data.success && data.sessionUrl) {
        // Redirect to Stripe's hosted checkout page
        window.location.href = data.sessionUrl;
      } else {
        showToast(data.error || 'Failed to create checkout session', 'error');
        setLoading(false);
      }
    } catch {
      showToast('An error occurred. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>Checkout</h1>

        {/* Steps */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <span className={styles.stepLabel}>Shipping</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <span className={styles.stepLabel}>Review & Pay</span>
          </div>
        </div>

        <div className={styles.checkoutLayout}>
          {/* Form */}
          <div className={styles.formSection}>
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className={styles.form} id="shipping-form">
                <h2 className={styles.formTitle}>Shipping Address</h2>
                <div className={styles.formGrid}>
                  <div className={`input-group ${styles.fullWidth}`}>
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      className="input"
                      placeholder="John Doe"
                      value={shipping.fullName}
                      onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={`input-group ${styles.fullWidth}`}>
                    <label htmlFor="address">Street Address</label>
                    <input
                      id="address"
                      type="text"
                      className="input"
                      placeholder="123 Main Street"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      className="input"
                      placeholder="New York"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      type="text"
                      className="input"
                      placeholder="NY"
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="zipCode">ZIP Code</label>
                    <input
                      id="zipCode"
                      type="text"
                      className="input"
                      placeholder="10001"
                      value={shipping.zipCode}
                      onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      className="input"
                      placeholder="+1 (555) 123-4567"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <Link href="/cart" className="btn btn-ghost">
                    ← Back to Cart
                  </Link>
                  <button type="submit" className="btn btn-primary btn-lg" id="continue-to-review">
                    Review Order →
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className={styles.form}>
                <h2 className={styles.formTitle}>Review & Pay</h2>

                {/* Shipping summary */}
                <div className={styles.cardPreview} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>📦 Shipping To</h3>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStep(1)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{shipping.fullName}</p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {shipping.address}, {shipping.city}, {shipping.state} {shipping.zipCode}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {shipping.phone}
                  </p>
                </div>

                {/* Stripe payment notice */}
                <div className={styles.secureNote} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  You&apos;ll be redirected to Stripe&apos;s secure payment page to complete your purchase. We never see your card details.
                </div>

                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    ← Back to Shipping
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handlePayWithStripe}
                    disabled={loading}
                    id="pay-with-stripe"
                  >
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      `Pay $${total.toFixed(2)} with Stripe`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Order Summary</h3>
              <div className={styles.sidebarItems}>
                {items.map((item) => (
                  <div key={item.product.id} className={styles.sidebarItem}>
                    <div className={styles.sidebarItemImage}>
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={56}
                        height={56}
                        className={styles.sidebarImg}
                      />
                      <span className={styles.sidebarQty}>{item.quantity}</span>
                    </div>
                    <div className={styles.sidebarItemInfo}>
                      <span className={styles.sidebarItemName}>{item.product.name}</span>
                      <span className={styles.sidebarItemPrice}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.sidebarDivider} />
              <div className={styles.sidebarRows}>
                <div className={styles.sidebarRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className={styles.sidebarRow}>
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className={styles.sidebarDivider} />
                <div className={`${styles.sidebarRow} ${styles.sidebarTotal}`}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
