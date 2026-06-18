'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import styles from './page.module.css';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch products on homepage', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="/hero-banner.png"
            alt="Luxe Store hero"
            fill
            priority
            className={styles.heroBgImage}
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>✨ New Season Collection</span>
            <h1 className={styles.heroTitle}>
              Elevate Your <br />
              <span className={styles.heroHighlight}>Everyday</span>
            </h1>
            <p className={styles.heroDesc}>
              Discover premium products curated for the modern lifestyle.
              From cutting-edge electronics to timeless accessories.
            </p>
            <div className={styles.heroActions}>
              <Link href="/shop" className="btn btn-primary btn-lg" id="hero-shop-now">
                Shop Now
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/shop?category=electronics" className="btn btn-secondary btn-lg" id="hero-explore">
                Explore Electronics
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>50K+</span>
                <span className={styles.heroStatLabel}>Happy Customers</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>4.9★</span>
                <span className={styles.heroStatLabel}>Average Rating</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>Free</span>
                <span className={styles.heroStatLabel}>Shipping $100+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
            <p className={styles.sectionSubtitle}>Find exactly what you&apos;re looking for</p>
          </div>
          <div className={styles.categoryGrid}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '20px 0' }}>
                <div className="spinner" />
              </div>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className={styles.categoryCard}
                  id={`category-${cat.slug}`}
                >
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span className={styles.categoryName}>{cat.name}</span>
                  <span className={styles.categoryCount}>{cat.count} products</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Featured Products</h2>
              <p className={styles.sectionSubtitle}>Handpicked favorites for you</p>
            </div>
            <Link href="/shop" className="btn btn-outline" id="view-all-featured">
              View All →
            </Link>
          </div>
          <div className={`${styles.productGrid} stagger-children`}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className={styles.promoBanner}>
        <div className="container">
          <div className={styles.promoContent}>
            <div className={styles.promoText}>
              <span className={styles.promoBadge}>Limited Time Offer</span>
              <h2 className={styles.promoTitle}>Get 25% Off Your First Order</h2>
              <p className={styles.promoDesc}>
                Sign up today and receive an exclusive discount on your first purchase. 
                Plus, get free shipping on all orders over $100.
              </p>
              <Link href="/auth" className="btn btn-primary btn-lg" id="promo-sign-up">
                Sign Up Now →
              </Link>
            </div>
            <div className={styles.promoVisual}>
              <div className={styles.promoCode}>
                <span className={styles.promoCodeLabel}>Use code</span>
                <span className={styles.promoCodeValue}>WELCOME25</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Trending Now</h2>
              <p className={styles.sectionSubtitle}>What everyone&apos;s adding to cart</p>
            </div>
            <Link href="/shop" className="btn btn-outline" id="view-all-trending">
              View All →
            </Link>
          </div>
          <div className={`${styles.productGrid} stagger-children`}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            ) : (
              trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🚀</div>
              <h3 className={styles.featureTitle}>Free Express Shipping</h3>
              <p className={styles.featureDesc}>On all orders over $100. Fast delivery, always.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureTitle}>Secure Payments</h3>
              <p className={styles.featureDesc}>Your data is protected with 256-bit encryption.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>↩️</div>
              <h3 className={styles.featureTitle}>Easy Returns</h3>
              <p className={styles.featureDesc}>30-day hassle-free return policy.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💬</div>
              <h3 className={styles.featureTitle}>24/7 Support</h3>
              <p className={styles.featureDesc}>Get help anytime with our dedicated team.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
