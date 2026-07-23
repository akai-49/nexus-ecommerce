'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const initGuestCart = useCartStore((state) => state.initGuestCart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const hydrateAuth = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    // Hydrate user auth state
    hydrateAuth();
    // Initialize guest cart uuid
    initGuestCart();
    // Load initial cart
    fetchCart();
  }, [hydrateAuth, initGuestCart, fetchCart]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
