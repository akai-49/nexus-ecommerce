'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Truck, ShieldCheck, RefreshCw, DollarSign, X } from 'lucide-react';
import axios from 'axios';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4000';

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Ship Modal State
  const [activeShipOrderId, setActiveShipOrderId] = useState<string | null>(null);
  const [shippingProvider, setShippingProvider] = useState('SHIPROCKET');
  const [shippingTrackingId, setShippingTrackingId] = useState('');

  const fetchOrders = () => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`${ADMIN_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data?.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleShipOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipOrderId || !shippingTrackingId.trim()) return;

    try {
      await axios.patch(
        `${ADMIN_API_URL}/orders/${activeShipOrderId}/status`,
        {
          status: 'SHIPPED',
          shippingProvider,
          shippingTrackingId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order status updated to SHIPPED!');
      setActiveShipOrderId(null);
      setShippingTrackingId('');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order to SHIPPED');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    if (!confirm('Mark this order as DELIVERED?')) return;
    try {
      await axios.patch(
        `${ADMIN_API_URL}/orders/${orderId}/status`,
        { status: 'DELIVERED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order status updated to DELIVERED!');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleProcessRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to trigger a refund for this order? This will contact payment gateways.')) return;
    try {
      await axios.post(
        `${ADMIN_API_URL}/orders/${orderId}/refund`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Refund processed and transaction recorded successfully!');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Refund processing failed');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
        <p className="text-sm text-muted-foreground">Manage customer purchases, ship items, assign tracking carriers, and issue refunds.</p>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-24 animate-pulse">Loading orders console...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground text-sm">No orders registered in system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Tracking Carrier / ID</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs">{order.orderNumber}</td>
                    <td className="p-4 font-medium">{order.user?.email || 'Guest checkout'}</td>
                    <td className="p-4 font-semibold text-primary">${Number(order.total).toFixed(2)}</td>
                    <td className="p-4 font-mono text-xs">{order.paymentMethod}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800' :
                        order.status === 'CANCELLED' ? 'bg-red-50 text-red-800' :
                        order.status === 'REFUNDED' ? 'bg-purple-50 text-purple-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      {order.shippingTrackingId ? (
                        <span>{order.shippingProvider} / {order.shippingTrackingId}</span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      {/* Ship Button */}
                      {(order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PAID') && (
                        <button
                          onClick={() => setActiveShipOrderId(order.id)}
                          className="rounded bg-primary text-white px-2.5 py-1 text-xs font-bold hover:bg-blue-600 flex items-center gap-1"
                        >
                          <Truck className="h-3 w-3" /> Ship
                        </button>
                      )}

                      {/* Deliver Button */}
                      {order.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          className="rounded bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" /> Deliver
                        </button>
                      )}

                      {/* Refund Button */}
                      {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && order.paymentStatus === 'COMPLETED' && (
                        <button
                          onClick={() => handleProcessRefund(order.id)}
                          className="rounded bg-purple-600 text-white px-2.5 py-1 text-xs font-bold hover:bg-purple-700 flex items-center gap-1"
                        >
                          <DollarSign className="h-3 w-3" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ship Order Modal */}
      {activeShipOrderId && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl p-6 shadow-lg max-w-md w-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Assign Shipping & Tracking</h3>
              <button onClick={() => setActiveShipOrderId(null)} className="p-1 rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleShipOrder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Select Carrier Provider</label>
                <select
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                >
                  <option value="SHIPROCKET">Shiprocket</option>
                  <option value="DELHIVERY">Delhivery</option>
                  <option value="BLUEDART">BlueDart</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRK987654321"
                  value={shippingTrackingId}
                  onChange={(e) => setShippingTrackingId(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-blue-600 shadow w-full"
              >
                Mark as Shipped
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
