'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, ShoppingCart, Users, LogOut, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
  };

  // If on login page, don't show layout sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Prevent SSR hydration mismatch and ensure children are rendered during SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        {children}
      </div>
    );
  }

  // Check roles: must be admin to view CMS pages
  const isAdmin = user?.roles?.some((role: string) =>
    ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER'].includes(role)
  );

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white p-6">
        <ShieldAlert className="h-16 w-16 text-yellow-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-sm text-slate-400 text-center max-w-md">
          This portal is reserved for authorized administrative staff. Please sign in with an admin account.
        </p>
        <Link
          href="/admin/login"
          className="rounded bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products CMS', path: '/admin/products', icon: ShoppingCart },
    { name: 'Orders CMS', path: '/admin/orders', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between flex-shrink-0">
        <div className="flex flex-col">
          <div className="h-16 flex items-center justify-center border-b border-slate-800 font-extrabold tracking-wider text-primary text-lg">
            NEXUS ADMIN
          </div>
          <nav className="flex-grow p-4 space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom profile info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Signed in as</span>
            <span className="text-sm font-bold truncate max-w-[120px]">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors p-2"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card shadow-sm flex items-center justify-between px-8">
          <h2 className="text-lg font-bold">Admin Management Console</h2>
          <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full font-semibold">
            Mode: Production-Ready
          </div>
        </header>

        <main className="flex-grow p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
