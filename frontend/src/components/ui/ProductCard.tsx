'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number | string;
    ratingAverage: number;
    reviewCount: number;
    category?: { name: string };
    brand?: { name: string };
    variants?: any[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Take first variant image or fallback placeholder
  const firstVariant = product.variants?.[0];
  const imageUrl = firstVariant?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
  const price = firstVariant?.price ? Number(firstVariant.price) : Number(product.basePrice);
  const compareAtPrice = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (firstVariant) {
      try {
        await addItem(firstVariant.id, 1);
        alert('Added to cart!');
      } catch (err: any) {
        alert(err.message || 'Out of stock!');
      }
    }
  };

  return (
    <Link 
      href={`/products/slug/${product.slug}`}
      className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md zoom-image-container"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-secondary overflow-hidden rounded-t-lg">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {compareAtPrice && compareAtPrice > price && (
          <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            Sale
          </span>
        )}
      </div>

      {/* Info Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>{product.brand?.name}</span>
          <span>{product.category?.name}</span>
        </div>

        <h3 className="text-sm font-semibold tracking-tight line-clamp-1 mb-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-amber-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star 
                key={idx} 
                className={`h-3 w-3 ${idx < Math.round(product.ratingAverage) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} 
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Pricing & Cart Action */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-primary">${price.toFixed(2)}</span>
            {compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">${compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <button 
            onClick={handleAddToCart}
            className="rounded-full bg-secondary p-2 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
