'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ShoppingBag, Search, Sun, Moon, User, X, ChevronDown, LogIn, LogOut, Package, Shield, UserPlus } from 'lucide-react';
import axios from 'axios';

const STORE_API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:5001';

export default function Navbar() {
  const router = useRouter();
  const cartQty = useCartStore((state) => state.totalQuantity);
  const { user, clearAuth } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Load theme preference
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  // Fetch categories for Mega Menu
  useEffect(() => {
    axios
      .get(`${STORE_API_URL}/products/categories`)
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Autocomplete search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      axios
        .get(`${STORE_API_URL}/products/search/suggestions?q=${searchQuery}`)
        .then((res) => setSuggestions(res.data || []))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">
              NEXUS
            </Link>

            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                Shop All
              </Link>
              {/* Mega Menu Toggle */}
              <div 
                className="relative cursor-pointer"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                  Categories <ChevronDown className="h-4 w-4" />
                </button>
                {megaMenuOpen && categories.length > 0 && (
                  <div className="absolute top-5 left-0 z-50 mt-2 w-64 rounded-md border bg-card p-4 shadow-lg">
                    <div className="grid gap-2">
                      {categories.map((cat) => (
                        <Link 
                          key={cat.id} 
                          href={`/products?categoryId=${cat.id}`}
                          className="block text-sm font-medium hover:text-primary transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
              title="Search products"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Dark Mode */}
            <button 
              onClick={toggleDarkMode}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            {/* Cart Icon */}
            <Link href="/cart" className="relative rounded-full p-2 hover:bg-secondary transition-colors mr-1" title="View Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartQty > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartQty}
                </span>
              )}
            </Link>

            {/* User Profile / Auth Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white uppercase">
                    {user.email ? user.email.charAt(0) : 'U'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate text-xs font-semibold">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {/* Profile Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 top-10 z-50 mt-2 w-56 rounded-xl border bg-card p-3 shadow-xl space-y-2">
                      <div className="px-2 py-1.5 border-b pb-2">
                        <p className="text-xs font-bold truncate text-foreground">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {user.roles?.includes('ADMIN') ? 'Administrator' : 'Customer'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Link
                          href="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-secondary transition-colors text-foreground"
                        >
                          <Package className="h-4 w-4 text-primary" />
                          My Orders
                        </Link>
                        {user.roles?.includes('ADMIN') && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-secondary transition-colors text-foreground"
                          >
                            <Shield className="h-4 w-4 text-purple-600" />
                            Admin Portal
                          </Link>
                        )}
                      </div>
                      <div className="border-t pt-1">
                        <button
                          onClick={() => {
                            clearAuth();
                            setUserDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <div className="flex items-center justify-between border-b pb-4">
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xl font-medium outline-none"
                  autoFocus
                />
              </form>
              <button 
                onClick={() => setSearchOpen(false)}
                className="rounded-full p-2 hover:bg-secondary transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-4 rounded-md border bg-card p-4 shadow-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</p>
                <div className="grid gap-2">
                  {suggestions.map((sug, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setSearchQuery(sug);
                        router.push(`/products?search=${encodeURIComponent(sug)}`);
                        setSearchOpen(false);
                      }}
                      className="text-left text-sm font-medium hover:text-primary transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
