'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { DollarSign, PackageOpen, ClipboardList, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4000';

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`${ADMIN_API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error('Fetch analytics failed:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center py-24 animate-pulse">Loading dashboard metrics...</div>;

  const revenue = data?.revenue?._sum?.total ? Number(data.revenue._sum.total) : 0;
  const activeOrders = data?.activeOrders || 0;
  const lowStock = data?.lowStock || 0;
  const totalProducts = data?.totalProducts || 0;

  // Format daily graph data for Recharts
  const graphData = data?.dailySales?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    sales: Number(item.sales),
    count: item.count,
  })) || [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome to Nexus administrator dashboard. Here is what is happening today.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1: Revenue */}
        <div className="rounded-xl border p-6 bg-card shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Revenue</span>
            <span className="text-2xl font-bold text-primary">${revenue.toFixed(2)}</span>
          </div>
          <div className="rounded-full bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="rounded-xl border p-6 bg-card shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Orders</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeOrders}</span>
          </div>
          <div className="rounded-full bg-slate-100 dark:bg-slate-850 p-3 text-slate-600 dark:text-slate-300">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Products */}
        <div className="rounded-xl border p-6 bg-card shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Products</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalProducts}</span>
          </div>
          <div className="rounded-full bg-slate-100 dark:bg-slate-850 p-3 text-slate-600 dark:text-slate-300">
            <PackageOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="rounded-xl border p-6 bg-card shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Low Stock Alert</span>
            <span className="text-2xl font-bold text-red-600">{lowStock}</span>
          </div>
          <div className="rounded-full bg-red-50 dark:bg-red-950/30 p-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Daily Sales Chart using Recharts */}
      <div className="rounded-xl border p-6 bg-card shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold">Sales Analysis</h2>
          <p className="text-xs text-muted-foreground">Daily sales performance charts representing operations over time.</p>
        </div>

        {graphData.length > 0 ? (
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed rounded-xl bg-secondary/20 mt-4 text-sm text-muted-foreground">
            No sales data generated yet. Confirm and verify orders checkout.
          </div>
        )}
      </div>

    </div>
  );
}
