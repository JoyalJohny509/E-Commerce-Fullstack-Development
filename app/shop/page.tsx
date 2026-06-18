'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import styles from './page.module.css';
import { Suspense } from 'react';

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(searchParam);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(categoryParam);
    setSearchQuery(searchParam);
  }, [categoryParam, searchParam]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeCategory && activeCategory !== 'all') {
          queryParams.append('category', activeCategory);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        if (sortBy) {
          queryParams.append('sort', sortBy);
        }

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await res.json();
        if (active && data.success) {
          setProducts(data.products);
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, searchQuery ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [activeCategory, sortBy, searchQuery]);

  const totalProductCount = categories.reduce((acc, cat) => acc + cat.count, 0);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              {searchQuery ? `Search: "${searchQuery}"` : 'Shop All Products'}
            </h1>
            <p className={styles.pageSubtitle}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <div className={styles.shopLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>Categories</h3>
              <div className={styles.filterList}>
                <button
                  className={`${styles.filterItem} ${activeCategory === 'all' ? styles.filterItemActive : ''}`}
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                  id="filter-all"
                >
                  <span>All Products</span>
                  <span className={styles.filterCount}>{totalProductCount}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.filterItem} ${activeCategory === cat.slug ? styles.filterItemActive : ''}`}
                    onClick={() => { setActiveCategory(cat.slug); setSearchQuery(''); }}
                    id={`filter-${cat.slug}`}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    <span className={styles.filterCount}>{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>Search</h3>
              <input
                type="text"
                className={`input ${styles.searchInput}`}
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="shop-search-input"
              />
            </div>
          </aside>

          {/* Product Grid */}
          <div className={styles.mainContent}>
            <div className={styles.toolbar}>
              <div className={styles.sortWrapper}>
                <label htmlFor="sort-select" className={styles.sortLabel}>Sort by:</label>
                <select
                  id="sort-select"
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '80px 0' }}>
                <div className="spinner" />
              </div>
            ) : products.length > 0 ? (
              <div className={`${styles.productGrid} stagger-children`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className="container"><div className="spinner" /></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
