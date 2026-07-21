'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5001';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const mergeCart = useCartStore((state) => state.mergeCart);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${STORE_API_URL}/auth/login`, {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = res.data;
      
      // Save tokens
      setAuth(accessToken, refreshToken, user);
      
      // Merge guest cart
      await mergeCart();

      alert('Logged in successfully!');
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border p-8 bg-card shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground">
            Or{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border p-2.5 pl-10 bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border p-2.5 pl-10 bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
