'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import styles from './page.module.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className="container">
          <div className={styles.emptyContent}>
            <span className={styles.emptyIcon}>🛒</span>
            <h1>Your Cart is Empty</h1>
            <p>Looks like you haven&apos;t added anything yet. Discover our curated collection.</p>
            <Link href="/shop" className="btn btn-primary btn-lg" id="continue-shopping">
              Start Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>Shopping Cart</h1>
        <p className={styles.subtitle}>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>

        <div className={styles.cartLayout}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {items.map((item) => (
              <div key={item.product.id} className={styles.cartItem}>
                <Link href={`/product/${item.product.id}`} className={styles.itemImage}>
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    width={120}
                    height={120}
                    className={styles.itemImg}
                  />
                </Link>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTop}>
                    <div>
                      <span className={styles.itemCategory}>{item.product.category}</span>
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className={styles.itemName}>{item.product.name}</h3>
                      </Link>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.product.id)}
                      aria-label={`Remove ${item.product.name}`}
                      id={`remove-${item.product.id}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.itemBottom}>
                    <div className={styles.quantityControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className={styles.itemPrice}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className={styles.freeShipping}>FREE</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className={styles.shippingNote}>
                  💡 Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </div>
              )}

              <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }} id="proceed-to-checkout">
                Proceed to Checkout
              </Link>

              <Link href="/shop" className="btn btn-ghost" style={{ width: '100%' }} id="continue-shopping-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
