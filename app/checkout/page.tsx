'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, useOrderStore, useAuthStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { ShippingAddress, PaymentDetails } from '@/lib/types';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const { placeOrder, setShippingAddress, setPaymentDetails } = useOrderStore();
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

  // Payment form state
  const [payment, setPayment] = useState<PaymentDetails>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const subtotal = getTotal();
  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  if (items.length === 0 && step < 3) {
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

  if (!isAuthenticated && step < 3) {
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
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Store shipping and payment details, then place order via API
    setShippingAddress(shipping);
    setPaymentDetails(payment);
    const order = await placeOrder();

    setLoading(false);
    if (order) {
      setStep(3);
      showToast('Order placed successfully!', 'success');
    } else {
      showToast('Failed to place order. Please try again.', 'error');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {step < 3 && (
          <>
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
                <span className={styles.stepLabel}>Payment</span>
              </div>
              <div className={styles.stepLine} />
              <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
                <div className={styles.stepNumber}>3</div>
                <span className={styles.stepLabel}>Confirmation</span>
              </div>
            </div>
          </>
        )}

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
                  <button type="submit" className="btn btn-primary btn-lg" id="continue-to-payment">
                    Continue to Payment →
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePaymentSubmit} className={styles.form} id="payment-form">
                <h2 className={styles.formTitle}>Payment Details</h2>

                <div className={styles.cardPreview}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardChip}>💳</span>
                    <span className={styles.cardBrand}>VISA</span>
                  </div>
                  <div className={styles.cardNumber}>
                    {payment.cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className={styles.cardBottom}>
                    <div>
                      <span className={styles.cardLabel}>Card Holder</span>
                      <span className={styles.cardValue}>{payment.cardHolder || 'YOUR NAME'}</span>
                    </div>
                    <div>
                      <span className={styles.cardLabel}>Expires</span>
                      <span className={styles.cardValue}>{payment.expiryDate || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={`input-group ${styles.fullWidth}`}>
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      id="cardNumber"
                      type="text"
                      className="input"
                      placeholder="4242 4242 4242 4242"
                      value={payment.cardNumber}
                      onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })}
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className={`input-group ${styles.fullWidth}`}>
                    <label htmlFor="cardHolder">Card Holder Name</label>
                    <input
                      id="cardHolder"
                      type="text"
                      className="input"
                      placeholder="John Doe"
                      value={payment.cardHolder}
                      onChange={(e) => setPayment({ ...payment, cardHolder: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <input
                      id="expiryDate"
                      type="text"
                      className="input"
                      placeholder="MM/YY"
                      value={payment.expiryDate}
                      onChange={(e) => setPayment({ ...payment, expiryDate: formatExpiry(e.target.value) })}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      type="text"
                      className="input"
                      placeholder="123"
                      value={payment.cvv}
                      onChange={(e) => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div className={styles.secureNote}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Your payment information is encrypted and secure
                </div>

                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    ← Back to Shipping
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="place-order">
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        Processing...
                      </>
                    ) : (
                      `Pay $${total.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className={styles.confirmation}>
                <div className={styles.confirmIcon}>✓</div>
                <h1 className={styles.confirmTitle}>Order Confirmed!</h1>
                <p className={styles.confirmDesc}>
                  Thank you for your purchase. Your order has been placed and is being processed.
                  You&apos;ll receive an email confirmation shortly.
                </p>
                <div className={styles.confirmActions}>
                  <Link href="/orders" className="btn btn-primary btn-lg" id="view-orders">
                    View My Orders
                  </Link>
                  <Link href="/shop" className="btn btn-secondary btn-lg" id="continue-shopping-confirm">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step < 3 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
