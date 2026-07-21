'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, ShieldAlert, ShoppingBag, Truck, BadgePercent } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5001';

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    axios
      .get(`${STORE_API_URL}/products/slug/${slug}`)
      .then((res) => {
        const prod = res.data;
        setProduct(prod);
        
        // Default to first variant
        if (prod?.variants?.length > 0) {
          const firstVar = prod.variants[0];
          setSelectedVariant(firstVar);
          setActiveImage(firstVar.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Product not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-center py-24 animate-pulse">Loading product details...</div>;
  if (error || !product) return <div className="text-center py-24 text-destructive font-medium">{error || 'Product not found'}</div>;

  const currentPrice = selectedVariant?.price ? Number(selectedVariant.price) : Number(product.basePrice);
  const compareAtPrice = selectedVariant?.compareAtPrice ? Number(selectedVariant.compareAtPrice) : null;

  // Compute available stock
  const inv = selectedVariant?.inventory?.[0];
  const stockQty = inv ? inv.quantity - inv.reservedQuantity : 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      await addItem(selectedVariant.id, 1);
      alert('Added to cart!');
    } catch (err: any) {
      alert(err.message || 'Out of stock');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Gallery / Images Section */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-xl border bg-secondary overflow-hidden zoom-image-container">
            <img 
              src={activeImage} 
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          {selectedVariant?.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedVariant.images.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-md border bg-secondary overflow-hidden ${activeImage === img.url ? 'ring-2 ring-primary' : 'opacity-70'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase text-primary tracking-wider">{product.brand?.name}</span>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex text-amber-500">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star 
                  key={idx} 
                  className={`h-4 w-4 ${idx < Math.round(product.ratingAverage) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} 
                />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.ratingAverage}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount} customer reviews)</span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-4 border-y py-4">
            <span className="text-3xl font-extrabold text-primary">${currentPrice.toFixed(2)}</span>
            {compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">${compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 1 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Select Variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      if (v.images?.[0]?.url) setActiveImage(v.images[0].url);
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${selectedVariant?.id === v.id ? 'bg-primary text-white border-primary shadow-sm' : 'hover:bg-secondary'}`}
                  >
                    {v.color} {v.size ? `/ ${v.size}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="flex items-center gap-2">
            {stockQty > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In Stock ({stockQty} units available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Checkout triggers */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              disabled={stockQty <= 0}
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow"
            >
              <ShoppingBag className="h-5 w-5" /> Add to Shopping Bag
            </button>
          </div>

          {/* Marketing badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6 text-sm">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Free Express Shipping</p>
                <p className="text-xs text-muted-foreground">On orders over $100. Delivery in 2-3 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Secure Payment & Encrypted API</p>
                <p className="text-xs text-muted-foreground">PCI-compliant transactions with instant checkouts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews */}
      <div className="mt-16 border-t pt-12 flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Product Description</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{product.description}</p>
        </div>

        {/* Reviews panel */}
        <div>
          <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>
          {product.reviews?.length > 0 ? (
            <div className="grid gap-6">
              {product.reviews.map((rev: any) => (
                <div key={rev.id} className="border rounded-xl p-6 bg-card flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{rev.user?.firstName || 'Verified Buyer'} {rev.user?.lastName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-3 w-3 ${idx < rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card">
              <p className="text-muted-foreground text-sm">No reviews yet for this product.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
