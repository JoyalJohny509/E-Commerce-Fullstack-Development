'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useOrderStore, useAuthStore } from '@/lib/store';
import styles from './page.module.css';

const statusConfig = {
  pending: { label: 'Pending', class: 'badge-warning', icon: '⏳' },
  processing: { label: 'Processing', class: 'badge-primary', icon: '⚙️' },
  shipped: { label: 'Shipped', class: 'badge-primary', icon: '📦' },
  delivered: { label: 'Delivered', class: 'badge-success', icon: '✅' },
  cancelled: { label: 'Cancelled', class: 'badge-danger', icon: '❌' },
};

export default function OrdersPage() {
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  if (!isAuthenticated) {
    return (
      <div className={styles.emptyState}>
        <div className="container">
          <span className={styles.emptyIcon}>🔒</span>
          <h1>Sign In Required</h1>
          <p>Please sign in to view your order history.</p>
          <Link href="/auth" className="btn btn-primary btn-lg">
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className="container">
          <span className={styles.emptyIcon}>📋</span>
          <h1>No Orders Yet</h1>
          <p>You haven&apos;t placed any orders. Start shopping to see your orders here.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            Browse Products →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>My Orders</h1>
        <p className={styles.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>

        <div className={styles.orderList}>
          {orders.map((order) => {
            const config = statusConfig[order.status];
            return (
              <div key={order.id} className={styles.orderCard}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <div className={styles.orderId}>
                      <span className={styles.orderIdLabel}>Order</span>
                      <span className={styles.orderIdValue}>{order.id}</span>
                    </div>
                    <span className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className={`badge ${config.class}`}>
                    {config.icon} {config.label}
                  </span>
                </div>

                {/* Order Items */}
                <div className={styles.orderItems}>
                  {order.items.map((item) => (
                    <div key={item.productId} className={styles.orderItem}>
                      <div className={styles.orderItemImage}>
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className={styles.orderItemImg}
                        />
                      </div>
                      <div className={styles.orderItemInfo}>
                        <span className={styles.orderItemName}>{item.productName}</span>
                        <span className={styles.orderItemMeta}>
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <span className={styles.orderItemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className={styles.orderFooter}>
                  <div className={styles.orderShipping}>
                    <span className={styles.shippingLabel}>Ships to:</span>
                    <span className={styles.shippingValue}>
                      {order.shippingAddress.city}, {order.shippingAddress.state}
                    </span>
                  </div>
                  <div className={styles.orderDetails}>
                    <div className={styles.orderDetail}>
                      <span>Payment</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className={styles.orderDetail}>
                      <span>Est. Delivery</span>
                      <span>
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className={`${styles.orderDetail} ${styles.orderTotal}`}>
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
