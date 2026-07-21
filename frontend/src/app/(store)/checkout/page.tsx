'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { ShieldCheck, Receipt, Truck } from 'lucide-react';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5001';

export default function CheckoutPage() {
  const { items, subtotal, fetchCart } = useCartStore();
  const token = useAuthStore((state) => state.token);

  // Address state
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'RAZORPAY' | 'PAYPAL' | 'COD'>('COD');

  // Page states
  const [loading, setLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [paymentToken, setPaymentToken] = useState('success');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    // In production we hit coupon validation endpoint. For simulation we mock coupon codes:
    if (couponCode === 'SAVE10') {
      const discVal = subtotal * 0.10;
      setDiscount(discVal);
      setCouponMessage('10% discount applied!');
    } else {
      setCouponMessage('Invalid coupon code');
      setDiscount(0);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !line1 || !city || !postalCode || !phone) {
      alert('Please fill out all address fields.');
      return;
    }

    setLoading(true);

    const addressPayload = { fullName, line1, city, postalCode, phone };
    const guestCartId = typeof window !== 'undefined' ? localStorage.getItem('guestCartId') : null;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${STORE_API_URL}/checkout`,
        {
          paymentMethod,
          couponCode: discount > 0 ? couponCode : undefined,
          shippingAddress: addressPayload,
          billingAddress: addressPayload,
          guestEmail: token ? undefined : guestEmail || 'guest@example.com',
          guestCartId: token ? undefined : guestCartId || undefined,
        },
        { headers }
      );

      setCheckoutResult(res.data);
      
      // If COD, cart is already cleared and order is confirmed!
      if (paymentMethod === 'COD') {
        await fetchCart();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMockPayment = async () => {
    if (!checkoutResult) return;
    setLoading(true);

    try {
      // Simulate verification callback from gateway widget success
      await axios.post(`${STORE_API_URL}/checkout/verify`, {
        orderId: checkoutResult.orderId,
        paymentId: checkoutResult.paymentId,
        token: paymentToken,
      });

      alert('Payment Verified! Order has been placed successfully.');
      setCheckoutResult((prev: any) => ({ ...prev, orderStatus: 'CONFIRMED' }));
      await fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const shippingFee = subtotal > 100 ? 0 : 15;
  const tax = (subtotal - discount) * 0.10;
  const finalTotal = subtotal - discount + shippingFee + tax;

  // Order Confirmed Screen
  if (checkoutResult && (paymentMethod === 'COD' || checkoutResult.orderStatus === 'CONFIRMED')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center flex flex-col items-center gap-6">
        <div className="rounded-full bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-950/30">
          <ShieldCheck className="h-16 w-16" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h1>
        <p className="text-sm text-muted-foreground">
          Thank you for your purchase. Your order <span className="font-bold text-primary">#{checkoutResult.orderNumber}</span> has been confirmed.
        </p>
        <div className="rounded-xl border p-6 bg-card w-full text-left flex flex-col gap-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold">Order Number:</span>
            <span>{checkoutResult.orderNumber}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold">Payment Status:</span>
            <span className="uppercase text-emerald-600 font-bold">Paid</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="font-semibold">Shipping Estimate:</span>
            <span>Estimated delivery in 2-3 business days</span>
          </div>
        </div>
        <div className="flex gap-4 w-full mt-4">
          <Link 
            href="/orders"
            className="flex-1 rounded-lg border py-3 text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Track Order
          </Link>
          <Link 
            href="/"
            className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Payment Intent Verification Screen (Stripe/Razorpay Simulation)
  if (checkoutResult) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center flex flex-col items-center gap-6">
        <div className="rounded-full bg-blue-50 p-4 text-blue-600 dark:bg-blue-950/30">
          <Receipt className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">Complete Payment Gate</h1>
        <p className="text-sm text-muted-foreground">
          Simulating checkout gateway integration widget for method: <span className="font-bold">{paymentMethod}</span>.
        </p>
        <div className="rounded-xl border p-6 bg-card w-full text-left flex flex-col gap-4 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Order Total:</span>
            <span className="font-bold text-primary">${checkoutResult.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Gateway Order ID:</span>
            <span className="font-mono text-xs">{checkoutResult.gatewayPaymentId}</span>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-semibold">Payment Token simulation</label>
            <select 
              value={paymentToken} 
              onChange={(e) => setPaymentToken(e.target.value)}
              className="rounded border p-2 bg-background w-full"
            >
              <option value="success">Simulate SUCCESS (Correct Token)</option>
              <option value="fail">Simulate FAIL (Incorrect Token)</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleConfirmMockPayment}
          disabled={loading}
          className="rounded-lg bg-primary py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow w-full"
        >
          {loading ? 'Confirming...' : 'Authorize Simulation Payment'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">Your shopping cart is empty.</div>
      ) : (
        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Address and Shipping details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Guest details */}
            {!token && (
              <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
                <h2 className="text-lg font-bold border-b pb-2">Guest Account Details</h2>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold border-b pb-2">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Alice Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold">Address Line 1</label>
                  <input 
                    type="text" 
                    required
                    placeholder="123 Main St"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">City</label>
                  <input 
                    type="text" 
                    required
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Postal Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="10001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="rounded border p-2.5 bg-background text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold border-b pb-2">Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['COD', 'STRIPE', 'RAZORPAY', 'PAYPAL'] as const).map((method) => (
                  <label 
                    key={method}
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === method ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-primary"
                    />
                    <span className="font-semibold text-sm">{method === 'COD' ? 'Cash on Delivery' : method}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Cart Summary & Coupon code */}
          <div className="flex flex-col gap-6">
            
            {/* Coupon Panel */}
            <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wide">Promo Code</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. SAVE10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded border p-2 bg-background text-sm"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded bg-secondary px-4 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-xs font-semibold ${discount > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold border-b pb-2">Order Review</h2>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4 text-base font-bold">
                <span>Final Total</span>
                <span className="text-primary">${finalTotal.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow w-full"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>

          </div>

        </form>
      )}
    </div>
  );
}
