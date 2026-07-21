'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5000';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Read filter values from query parameters
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';

  // Fetch filter metadata (categories/brands)
  useEffect(() => {
    Promise.all([
      axios.get(`${STORE_API_URL}/products/categories`),
      axios.get(`${STORE_API_URL}/products/brands`),
    ])
      .then(([catRes, brandRes]) => {
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch product list
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '8');
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (brandId) params.set('brandId', brandId);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy) params.set('sortBy', sortBy);

    axios
      .get(`${STORE_API_URL}/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page, search, categoryId, brandId, minPrice, maxPrice, sortBy]);

  const updateFilters = (newFilters: Record<string, string | number>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === '') {
        current.delete(key);
      } else {
        current.set(key, val.toString());
      }
    });
    current.set('page', '1'); // Reset to page 1 on filter
    router.push(`/products?${current.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', newPage.toString());
    router.push(`/products?${current.toString()}`);
  };

  const totalPages = Math.ceil(total / 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6 rounded-lg border p-6 bg-card">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Categories</h3>
            <select 
              value={categoryId}
              onChange={(e) => updateFilters({ categoryId: e.target.value })}
              className="w-full rounded-md border p-2 bg-background text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Brands</h3>
            <select 
              value={brandId}
              onChange={(e) => updateFilters({ brandId: e.target.value })}
              className="w-full rounded-md border p-2 bg-background text-sm"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Price Range</h3>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                className="w-full rounded-md border p-2 bg-background text-sm"
              />
              <input 
                type="number" 
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                className="w-full rounded-md border p-2 bg-background text-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Sort By</h3>
            <select 
              value={sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="w-full rounded-md border p-2 bg-background text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </aside>

        {/* Product Grid & List */}
        <main className="flex-grow flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
            <span className="text-sm text-muted-foreground">{total} items found</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex flex-col gap-4 rounded-lg border p-4 bg-card animate-pulse">
                  <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button 
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <button 
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 border border-dashed rounded-xl bg-card">
              <p className="text-muted-foreground font-medium">No products matching the selected filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-24">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
