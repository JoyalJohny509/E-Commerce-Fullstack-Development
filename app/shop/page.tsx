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
  const aiParam = searchParams.get('ai') === 'true';

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [isAiSearch, setIsAiSearch] = useState(aiParam);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(categoryParam);
    setSearchQuery(searchParam);
    setIsAiSearch(aiParam);
  }, [categoryParam, searchParam, aiParam]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        let data;

        if (isAiSearch && searchQuery) {
          const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(searchQuery)}`);
          data = await res.json();

          // Since semantic search API doesn't return categories, fetch them if needed
          if (categories.length === 0) {
            const catRes = await fetch('/api/products');
            const catData = await catRes.json();
            if (active && catData.success && catData.categories) {
              setCategories(catData.categories);
            }
          }
        } else {
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
          data = await res.json();
        }

        if (active && data.success) {
          setProducts(data.products);
          setAiSummary(data.summary || null);
          if (data.categories) {
            setCategories(data.categories);
          }
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
  }, [activeCategory, sortBy, searchQuery, isAiSearch]);

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
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); setIsAiSearch(false); setAiSummary(null); }}
                  id="filter-all"
                >
                  <span>All Products</span>
                  <span className={styles.filterCount}>{totalProductCount}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.filterItem} ${activeCategory === cat.slug ? styles.filterItemActive : ''}`}
                    onClick={() => { setActiveCategory(cat.slug); setSearchQuery(''); setIsAiSearch(false); setAiSummary(null); }}
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
                className={`input ${styles.searchInput} ${isAiSearch ? styles.searchInputAi : ''}`}
                placeholder={isAiSearch ? "✨ AI Semantic search..." : "Search products..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="shop-search-input"
              />
              <label className={styles.aiToggleLabel}>
                <input
                  type="checkbox"
                  checked={isAiSearch}
                  onChange={(e) => {
                    setIsAiSearch(e.target.checked);
                    if (!e.target.checked) setAiSummary(null);
                  }}
                  className={styles.aiCheckbox}
                />
                <span className={styles.aiToggleText}>
                  ✨ AI Semantic Search
                </span>
              </label>
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

            {/* AI Summary Banner */}
            {aiSummary && (
              <div className={styles.aiSummaryContainer}>
                <div className={styles.aiSummaryHeader}>
                  <span className={styles.aiSummaryBadge}>✨ AI Semantic Summary</span>
                  <button
                    onClick={() => setAiSummary(null)}
                    className={styles.aiSummaryClose}
                    aria-label="Dismiss AI summary"
                  >
                    ×
                  </button>
                </div>
                <p className={styles.aiSummaryText}>{aiSummary}</p>
              </div>
            )}

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
                <p>{isAiSearch ? "Try describing what you are looking for in different words" : "Try adjusting your search or filter criteria"}</p>
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
