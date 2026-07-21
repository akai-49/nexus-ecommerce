'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCartStore } from '@/store/useCartStore';

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

  useEffect(() => {
    // Initialize guest cart uuid
    initGuestCart();
    // Load initial cart
    fetchCart();
  }, [initGuestCart, fetchCart]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
