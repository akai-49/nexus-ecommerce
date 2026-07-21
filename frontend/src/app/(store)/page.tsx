'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products and categories
    Promise.all([
      axios.get(`${STORE_API_URL}/products?limit=4`),
      axios.get(`${STORE_API_URL}/products/categories`),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data?.items || []);
        setCategories(catRes.data || []);
      })
      .catch((err) => console.error('Fetch home stats failed:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Premium Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-slate-900" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 max-w-2xl">
          <span className="text-sm font-semibold tracking-wider text-blue-400 uppercase">Introducing Nexus</span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            The Future of Retail is Here.
          </h1>
          <p className="text-lg text-slate-300">
            Discover our curated collections featuring state of the art electronics, custom designs, and premium accessories.
          </p>
          <div className="flex gap-4 mt-4">
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow transition-colors"
            >
              Shop Collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Selling Points Badges */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border rounded-xl p-8 bg-card shadow-sm">
          <div className="flex flex-col items-center text-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <h4 className="font-semibold text-sm">Free Delivery</h4>
            <p className="text-xs text-muted-foreground">On all orders above $100</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h4 className="font-semibold text-sm">Secure Payment</h4>
            <p className="text-xs text-muted-foreground">Stripe, PayPal, UPI enabled</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            <h4 className="font-semibold text-sm">Easy Returns</h4>
            <p className="text-xs text-muted-foreground">30-day money-back guarantee</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h4 className="font-semibold text-sm">Cash on Delivery</h4>
            <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((cat) => (
              <Link 
                key={cat.id} 
                href={`/products?categoryId=${cat.id}`}
                className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-secondary transition-all hover:shadow-md"
              >
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors" />
                <span className="relative text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide group-hover:scale-105 transition-transform">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
          <Link href="/products" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            See all products <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-lg border p-4 bg-card animate-pulse">
                <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground font-medium">No products found. Run migrations and seed data.</p>
          </div>
        )}
      </section>
    </div>
  );
}
