'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, User, Order, ShippingAddress } from './types';

// ============ Auth Store ============
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (data.success) {
            set({ user: data.user, isAuthenticated: true });
            // Sync local cart to server after login
            const cartState = useCartStore.getState();
            if (cartState.items.length > 0) {
              for (const item of cartState.items) {
                await fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: item.product.id, quantity: item.quantity }),
                });
              }
            }
            // Fetch server cart
            await useCartStore.getState().fetchCart();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      register: async (name: string, email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (data.success) {
            set({ user: data.user, isAuthenticated: true });
            // Sync local cart to server after register
            const cartState = useCartStore.getState();
            if (cartState.items.length > 0) {
              for (const item of cartState.items) {
                await fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: item.product.id, quantity: item.quantity }),
                });
              }
              await useCartStore.getState().fetchCart();
            }
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // ignore
        }
        set({ user: null, isAuthenticated: false });
        useCartStore.getState().clearCartLocal();
      },
      checkAuth: async () => {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            // Fetch server cart
            await useCartStore.getState().fetchCart();
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    { name: 'luxe-auth-storage' }
  )
);

// ============ Cart Store ============
interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearCartLocal: () => void;
  fetchCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (product: Product) => {
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          // Server-side cart
          try {
            const res = await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            const data = await res.json();
            if (data.success) {
              set({ items: data.items });
              return;
            }
          } catch {
            // fallback to local
          }
        }
        // Local cart (guest)
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeItem: async (productId: string) => {
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            const res = await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              set({ items: data.items });
              return;
            }
          } catch {
            // fallback to local
          }
        }
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            const res = await fetch(`/api/cart/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity }),
            });
            const data = await res.json();
            if (data.success) {
              set({ items: data.items });
              return;
            }
          } catch {
            // fallback to local
          }
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: async () => {
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            await fetch('/api/cart', { method: 'DELETE' });
          } catch {
            // ignore
          }
        }
        set({ items: [] });
      },

      clearCartLocal: () => set({ items: [] }),

      fetchCart: async () => {
        try {
          const res = await fetch('/api/cart');
          const data = await res.json();
          if (data.success) {
            set({ items: data.items });
          }
        } catch {
          // keep local state
        }
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: 'luxe-cart-storage' }
  )
);

// ============ Order Store ============
interface CheckoutState {
  step: number;
  shippingAddress: ShippingAddress | null;
}

interface OrderStore {
  orders: Order[];
  checkout: CheckoutState;
  isLoading: boolean;
  setCheckoutStep: (step: number) => void;
  setShippingAddress: (address: ShippingAddress) => void;
  fetchOrders: () => Promise<void>;
  resetCheckout: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      isLoading: false,
      checkout: {
        step: 1,
        shippingAddress: null,
      },
      setCheckoutStep: (step: number) =>
        set((state) => ({ checkout: { ...state.checkout, step } })),
      setShippingAddress: (address: ShippingAddress) =>
        set((state) => ({ checkout: { ...state.checkout, shippingAddress: address } })),

      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/orders');
          const data = await res.json();
          if (data.success) {
            set({ orders: data.orders, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      resetCheckout: () =>
        set({
          checkout: { step: 1, shippingAddress: null },
        }),
    }),
    { name: 'luxe-order-storage' }
  )
);
