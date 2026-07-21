'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Package, Truck, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5000';

export default function UserOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  const [activeReturnOrderId, setActiveReturnOrderId] = useState<string | null>(null);

  const fetchOrders = () => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`${STORE_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axios.post(
        `${STORE_API_URL}/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order cancelled successfully.');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnOrderId || !returnReason.trim()) return;

    try {
      await axios.post(
        `${STORE_API_URL}/orders/${activeReturnOrderId}/return`,
        { reason: returnReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Return requested successfully.');
      setActiveReturnOrderId(null);
      setReturnReason('');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request return');
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center flex flex-col items-center gap-6">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Please log in to track orders</h1>
        <p className="text-sm text-muted-foreground">
          You must be logged in to view your orders list and track shipments.
        </p>
        <Link 
          href="/login"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Orders</h1>

      {loading ? (
        <div className="text-center py-12 animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-xl bg-card flex flex-col items-center gap-4">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No orders found</h2>
          <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl bg-card shadow-sm overflow-hidden">
              
              {/* Top Banner */}
              <div className="bg-secondary/50 p-4 border-b flex flex-wrap gap-4 justify-between items-center text-sm">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Order Placed</p>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Total Amount</p>
                    <p className="font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Order Number</p>
                    <p className="font-mono">{order.orderNumber}</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800' :
                    order.status === 'CANCELLED' ? 'bg-red-50 text-red-800' :
                    'bg-blue-50 text-blue-800'
                  }`}>
                    Status: {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 flex flex-col gap-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative h-16 w-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={item.variant?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'} 
                        alt={item.variant?.product?.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold line-clamp-1">{item.variant?.product?.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Variant: {item.variant?.color} {item.variant?.size ? `/ ${item.variant.size}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold">${Number(item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Footer details & Tracking actions */}
              <div className="p-4 bg-secondary/10 border-t flex flex-wrap justify-between items-center gap-4 text-xs">
                {order.shippingTrackingId ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Tracking Carrier: <span className="font-bold">{order.shippingProvider}</span>, ID: <span className="font-mono font-bold">{order.shippingTrackingId}</span></span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Awaiting shipment tracking assignment...</span>
                )}

                <div className="flex gap-2">
                  {/* Cancellation */}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="rounded border border-red-200 px-3 py-1.5 font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel Order
                    </button>
                  )}

                  {/* Return Request */}
                  {order.status === 'DELIVERED' && !order.notes?.includes('[Return Requested:') && (
                    <button
                      onClick={() => setActiveReturnOrderId(order.id)}
                      className="rounded border px-3 py-1.5 font-bold hover:bg-secondary transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Request Return
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Return Request Modal */}
      {activeReturnOrderId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl p-6 shadow-lg max-w-md w-full flex flex-col gap-4">
            <h3 className="text-lg font-bold">Request Return</h3>
            <p className="text-xs text-muted-foreground">
              Please provide a reason for returning this order. Our team will review the request.
            </p>
            <form onSubmit={handleRequestReturn} className="flex flex-col gap-4">
              <textarea
                required
                placeholder="Reason for return..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full min-h-[100px] rounded border p-2.5 bg-background text-sm"
              />
              <div className="flex gap-3 justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setActiveReturnOrderId(null)}
                  className="rounded border px-4 py-2 hover:bg-secondary font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary text-white px-4 py-2 hover:bg-blue-700 font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
