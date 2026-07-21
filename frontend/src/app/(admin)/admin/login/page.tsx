'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import axios from 'axios';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4000';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${ADMIN_API_URL}/auth/login`, {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = res.data;

      // Check if user has permission to log in to Admin panel
      const isAdmin = user.roles.some((role: string) =>
        ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER'].includes(role)
      );

      if (!isAdmin) {
        throw new Error('Access denied. Insufficient administrative permissions.');
      }

      // Map roles correctly
      const mappedUser = {
        id: user.id,
        email: user.email,
        roles: user.roles,
      };

      setAuth(accessToken, refreshToken, mappedUser);
      alert('Welcome back to Admin console!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Login failed. Invalid administrative credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-800 p-8 bg-slate-900 text-white shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/15 p-3 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">NEXUS Admin Gateway</h2>
          <p className="text-xs text-slate-400">Sign in with your CMS credentials</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/30 border border-red-500/50 p-3 text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">Administrative Email</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@nexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-slate-800 p-2.5 pl-10 bg-slate-950 text-sm text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">Secure Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-slate-800 p-2.5 pl-10 bg-slate-950 text-sm text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
