'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { useToast } from './Toast';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    showToast(`${product.name} added to cart!`, 'success');
  };

  return (
    <Link href={`/product/${product.id}`} className={styles.card} id={`product-card-${product.id}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className={styles.image}
        />
        {product.badge && (
          <span className={styles.badge}>{product.badge}</span>
        )}
        {discount > 0 && (
          <span className={styles.discount}>-{discount}%</span>
        )}
        <div className={styles.overlay}>
          <button className={styles.quickAdd} onClick={handleAddToCart} id={`add-to-cart-${product.id}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.rating}>
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={i < Math.floor(product.rating) ? '#f59e0b' : 'none'}
                stroke="#f59e0b"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
          <span className={styles.reviewCount}>({product.reviewCount.toLocaleString()})</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
