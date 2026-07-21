import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

// Determine backend endpoints
const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5000';

interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant: any;
}

interface CartState {
  guestCartId: string | null;
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  initGuestCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  mergeCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => {
  const isClient = typeof window !== 'undefined';

  // Generate guest cart ID if none exists
  const getOrGenerateGuestId = () => {
    if (!isClient) return null;
    let gid = localStorage.getItem('guestCartId');
    if (!gid) {
      gid = `guest_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      localStorage.setItem('guestCartId', gid);
    }
    return gid;
  };

  const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    guestCartId: null,
    items: [],
    totalQuantity: 0,
    subtotal: 0,
    loading: false,
    error: null,

    initGuestCart: () => {
      const guestCartId = getOrGenerateGuestId();
      set({ guestCartId });
    },

    fetchCart: async () => {
      set({ loading: true, error: null });
      const guestId = get().guestCartId || getOrGenerateGuestId();
      if (!guestId) return;

      try {
        const headers = getHeaders();
        // Read cart from store backend
        const url = `${STORE_API_URL}/cart${useAuthStore.getState().token ? '' : `?guestId=${guestId}`}`;
        const res = await axios.get(url, { headers });

        const items = res.data?.items || [];
        const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        
        // Calculate subtotal from DB prices
        const subtotal = items.reduce((sum: number, item: any) => {
          const price = item.variant?.price ? Number(item.variant.price) : Number(item.variant?.product?.basePrice || 0);
          return sum + price * item.quantity;
        }, 0);

        set({ items, totalQuantity, subtotal, guestCartId: guestId, loading: false });
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Failed to fetch cart', loading: false });
      }
    },

    addItem: async (variantId, quantity) => {
      const guestId = get().guestCartId || getOrGenerateGuestId();
      try {
        const headers = getHeaders();
        const url = `${STORE_API_URL}/cart${useAuthStore.getState().token ? '' : `?guestId=${guestId}`}`;
        await axios.post(url, { variantId, quantity }, { headers });
        await get().fetchCart();
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to add item to cart');
      }
    },

    updateQuantity: async (variantId, quantity) => {
      const guestId = get().guestCartId || getOrGenerateGuestId();
      try {
        const headers = getHeaders();
        const url = `${STORE_API_URL}/cart/${variantId}${useAuthStore.getState().token ? '' : `?guestId=${guestId}`}`;
        await axios.patch(url, { quantity }, { headers });
        await get().fetchCart();
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to update quantity');
      }
    },

    removeItem: async (variantId) => {
      const guestId = get().guestCartId || getOrGenerateGuestId();
      try {
        const headers = getHeaders();
        const url = `${STORE_API_URL}/cart/${variantId}${useAuthStore.getState().token ? '' : `?guestId=${guestId}`}`;
        await axios.delete(url, { headers });
        await get().fetchCart();
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to remove item');
      }
    },

    mergeCart: async () => {
      const guestId = get().guestCartId;
      const token = useAuthStore.getState().token;
      if (!guestId || !token) return;

      try {
        await axios.post(
          `${STORE_API_URL}/cart/merge`,
          { guestId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Clear guest cart ID from local storage after merging
        localStorage.removeItem('guestCartId');
        set({ guestCartId: null });
        await get().fetchCart();
      } catch (err: any) {
        console.error('Failed to merge cart:', err);
      }
    },
  };
});
