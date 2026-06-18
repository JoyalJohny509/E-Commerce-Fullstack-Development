'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import styles from './page.module.css';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product', err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <div className="container">
          <h1>Product Not Found</h1>
          <p>The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/shop" className="btn btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    showToast(`${quantity}x ${product.name} added to cart!`, 'success');
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/shop">Shop</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href={`/shop?category=${product.category}`}>{product.category}</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Detail */}
        <div className={styles.productLayout}>
          {/* Image */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <Image
                src={product.image}
                alt={product.name}
                width={600}
                height={600}
                className={styles.image}
                priority
              />
              {product.badge && (
                <span className={styles.badge}>{product.badge}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <span className={styles.category}>{product.category}</span>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.rating}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={i < Math.floor(product.rating) ? '#f59e0b' : 'none'}
                    stroke="#f59e0b"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className={styles.ratingText}>
                {product.rating} ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            <div className={styles.priceSection}>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  <span className={styles.discountBadge}>Save {discount}%</span>
                </>
              )}
            </div>

            <p className={styles.description}>{product.description}</p>

            {product.features && (
              <div className={styles.features}>
                <h3 className={styles.featuresTitle}>Key Features</h3>
                <ul className={styles.featureList}>
                  {product.features.map((feature, i) => (
                    <li key={i} className={styles.featureItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add to Cart */}
            <div className={styles.addToCart}>
              <div className={styles.quantityControl}>
                <button
                  className={styles.quantityBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  id="qty-decrease"
                >
                  −
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  className={styles.quantityBtn}
                  onClick={() => setQuantity(quantity + 1)}
                  id="qty-increase"
                >
                  +
                </button>
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                id="product-add-to-cart"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Add to Cart — ${(product.price * quantity).toFixed(2)}
              </button>
            </div>

            {/* Trust */}
            <div className={styles.trustBadges}>
              <div className={styles.trustItem}>🚀 Free shipping on $100+</div>
              <div className={styles.trustItem}>↩️ 30-day returns</div>
              <div className={styles.trustItem}>🔒 Secure checkout</div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>You Might Also Like</h2>
            <div className={`${styles.relatedGrid} stagger-children`}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
