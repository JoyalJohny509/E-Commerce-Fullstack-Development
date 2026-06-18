import { Product, Category } from './types';

export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', icon: '🔌', count: 3 },
  { id: '2', name: 'Accessories', slug: 'accessories', icon: '👜', count: 3 },
  { id: '3', name: 'Fashion', slug: 'fashion', icon: '👟', count: 2 },
];

export const products: Product[] = [
  {
    id: 'prod-001',
    name: 'Nova Pro Wireless Headphones',
    description: 'Experience studio-quality sound with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for audiophiles and professionals alike.',
    price: 299.99,
    originalPrice: 399.99,
    image: '/products/headphones.png',
    category: 'electronics',
    rating: 4.8,
    reviewCount: 2341,
    inStock: true,
    badge: 'Best Seller',
    features: [
      'Active Noise Cancellation',
      '40-hour battery life',
      'Hi-Res Audio certified',
      'Memory foam ear cushions',
      'Multi-device connectivity',
    ],
  },
  {
    id: 'prod-002',
    name: 'Aura Elite Smartwatch',
    description: 'Stay connected and track your health with this premium smartwatch featuring AMOLED display, heart rate monitoring, GPS, and 7-day battery life in a stunning rose gold finish.',
    price: 449.99,
    originalPrice: 549.99,
    image: '/products/smartwatch.png',
    category: 'electronics',
    rating: 4.7,
    reviewCount: 1876,
    inStock: true,
    badge: 'New Arrival',
    features: [
      '1.4" AMOLED Display',
      'Heart rate & SpO2 monitoring',
      'Built-in GPS',
      '7-day battery life',
      '5ATM water resistance',
    ],
  },
  {
    id: 'prod-003',
    name: 'Heritage Leather Messenger Bag',
    description: 'Handcrafted from full-grain Italian leather, this messenger bag combines timeless style with modern functionality. Features padded laptop compartment and multiple organizer pockets.',
    price: 189.99,
    originalPrice: 249.99,
    image: '/products/bag.png',
    category: 'accessories',
    rating: 4.9,
    reviewCount: 987,
    inStock: true,
    badge: 'Premium',
    features: [
      'Full-grain Italian leather',
      'Fits 15" laptops',
      'Brass hardware',
      'Adjustable shoulder strap',
      'Interior organizer pockets',
    ],
  },
  {
    id: 'prod-004',
    name: 'Cloud Runner Sneakers',
    description: 'Ultra-lightweight running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort whether you\'re hitting the track or the streets.',
    price: 159.99,
    image: '/products/sneakers.png',
    category: 'fashion',
    rating: 4.6,
    reviewCount: 3201,
    inStock: true,
    features: [
      'Ultra-lightweight design',
      'Responsive cushioning',
      'Breathable mesh upper',
      'Non-slip rubber outsole',
      'Reflective details',
    ],
  },
  {
    id: 'prod-005',
    name: 'Zenith Aviator Sunglasses',
    description: 'Classic aviator design with polarized lenses and a lightweight titanium frame. UV400 protection meets vintage-inspired luxury in this timeless accessory.',
    price: 219.99,
    originalPrice: 279.99,
    image: '/products/sunglasses.png',
    category: 'accessories',
    rating: 4.5,
    reviewCount: 1456,
    inStock: true,
    badge: 'Trending',
    features: [
      'Polarized lenses',
      'Titanium frame',
      'UV400 protection',
      'Anti-reflective coating',
      'Premium leather case included',
    ],
  },
  {
    id: 'prod-006',
    name: 'Lumix Pro Mirrorless Camera',
    description: 'Capture stunning photos and 4K video with this professional-grade mirrorless camera. Features a 24.2MP sensor, in-body stabilization, and weather-sealed construction.',
    price: 1299.99,
    originalPrice: 1499.99,
    image: '/products/camera.png',
    category: 'electronics',
    rating: 4.9,
    reviewCount: 654,
    inStock: true,
    badge: 'Pro Choice',
    features: [
      '24.2MP Full-Frame sensor',
      '4K 60fps video',
      '5-axis in-body stabilization',
      'Weather-sealed body',
      'Dual card slots',
    ],
  },
  {
    id: 'prod-007',
    name: 'Pulse Portable Speaker',
    description: 'Take your music anywhere with this waterproof Bluetooth speaker. Rich 360° sound, 20-hour battery, and a rugged design that\'s ready for any adventure.',
    price: 79.99,
    image: '/products/speaker.png',
    category: 'electronics',
    rating: 4.4,
    reviewCount: 4521,
    inStock: true,
    features: [
      '360° immersive sound',
      '20-hour battery life',
      'IP67 waterproof',
      'Built-in microphone',
      'USB-C fast charging',
    ],
  },
  {
    id: 'prod-008',
    name: 'Monarch Slim Wallet',
    description: 'Minimalist design meets premium craftsmanship. This slim wallet holds up to 8 cards and features RFID-blocking technology, all wrapped in buttery-soft Nappa leather.',
    price: 69.99,
    originalPrice: 89.99,
    image: '/products/wallet.png',
    category: 'accessories',
    rating: 4.7,
    reviewCount: 2109,
    inStock: true,
    features: [
      'Nappa leather construction',
      'RFID-blocking technology',
      'Holds up to 8 cards',
      'Slim profile design',
      'Gift box included',
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'all') return products;
  return products.filter((p) => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}
