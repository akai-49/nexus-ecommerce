'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, subtotal, totalQuantity, loading, updateQuantity, removeItem } = useCartStore();

  const handleQtyChange = async (variantId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    try {
      await updateQuantity(variantId, newQty);
    } catch (err: any) {
      alert(err.message || 'Limit reached!');
    }
  };

  if (loading && items.length === 0) return <div className="text-center py-24 animate-pulse">Loading shopping cart...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-xl bg-card flex flex-col items-center gap-4">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your shopping bag is empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Before you can check out, you must add some items to your shopping cart.
          </p>
          <Link 
            href="/products"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              const variant = item.variant;
              const product = variant?.product;
              const price = variant?.price ? Number(variant.price) : Number(product?.basePrice || 0);
              const imageUrl = variant?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

              return (
                <div key={item.id} className="flex gap-4 border rounded-xl p-4 bg-card shadow-sm">
                  {/* Thumbnail */}
                  <div className="relative h-24 w-24 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
                    <img src={imageUrl} alt={product?.name} className="h-full w-full object-cover" />
                  </div>

                  {/* Info details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold line-clamp-1">{product?.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        Variant: {variant?.color} {variant?.size ? `/ ${variant.size}` : ''}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQtyChange(variant.id, item.quantity, -1)}
                        className="rounded border h-7 w-7 flex items-center justify-center font-bold hover:bg-secondary"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(variant.id, item.quantity, 1)}
                        className="rounded border h-7 w-7 flex items-center justify-center font-bold hover:bg-secondary"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price & Delete */}
                  <div className="flex flex-col justify-between items-end">
                    <span className="text-base font-bold text-primary">${(price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeItem(variant.id)}
                      className="text-muted-foreground hover:text-destructive p-2 rounded-full hover:bg-secondary transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="flex flex-col gap-6 rounded-xl border p-6 bg-card shadow-sm h-fit">
            <h2 className="text-lg font-bold border-b pb-3">Order Summary</h2>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal ({totalQuantity} items)</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-emerald-600">
                  {subtotal > 100 ? 'FREE' : '$15.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Tax (10%)</span>
                <span className="font-semibold">${(subtotal * 0.10).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-base font-bold">
              <span>Order Total</span>
              <span className="text-primary">${(subtotal + (subtotal > 100 ? 0 : 15) + (subtotal * 0.10)).toFixed(2)}</span>
            </div>

            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white hover:bg-blue-700 shadow transition-colors w-full"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            {subtotal < 100 && (
              <p className="text-xs text-center text-muted-foreground">
                Add <span className="font-bold text-primary">${(100 - subtotal).toFixed(2)}</span> more to unlock free shipping!
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
