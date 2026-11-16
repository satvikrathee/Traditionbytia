'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  ExternalLink,
  Shield,
  Wifi,
  Menu,
  X,
  LogOut,
  QrCode,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast.error('Restricted access. Administrator privileges required.');
      router.push('/login?redirect=/admin');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:admin');

    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Listen to real-time order alerts in admin room
    socket.on('order:created', (data) => {
      toast.success(
        `New Royal Order received! #${data.order?._id?.slice(-8).toUpperCase()} - ₹${data.order?.total?.toLocaleString('en-IN')}`,
        { icon: '👑', duration: 6000 }
      );
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:created');
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Tag },
    { name: 'Inventory (Inline)', href: '/admin/inventory', icon: Layers },
    { name: 'Orders & Shipments', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'UPI Settings', href: '/admin/upi-settings', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-maroon-900 text-cream-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-maroon-800 flex items-center justify-between">
            <Link href="/admin" className="block">
              <span className="font-serif text-xl font-bold tracking-wider text-cream-100">
                Traditions
              </span>
              <span className="font-serif text-sm italic text-gold-400 mx-1">By</span>
              <span className="font-serif text-xl font-bold tracking-wider text-cream-100">
                Tiya
              </span>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-gold-400 font-bold mt-0.5">
                Admin Control Room
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-cream-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
                    isActive
                      ? 'bg-gold-500 text-maroon-950 shadow-md font-bold'
                      : 'text-cream-300 hover:bg-maroon-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Live Status & Profile */}
        <div className="p-4 border-t border-maroon-800 space-y-3">
          {/* Real-time Socket Indicator */}
          <div className="flex items-center justify-between px-3 py-2 bg-maroon-950/60 rounded-xl text-[11px] border border-maroon-800">
            <span className="flex items-center gap-2 text-cream-300">
              <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              Socket.io Stream
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                isConnected ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
              }`}
            >
              {isConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 bg-maroon-800/60 hover:bg-maroon-800 rounded-xl text-xs text-cream-200 transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-cream-400 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-charcoal hover:text-maroon-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-600 hidden sm:block" />
              <span className="text-xs uppercase tracking-wider font-bold text-maroon-800">
                Traditions By Tiya Administration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-charcoal-muted hidden sm:inline">Signed in as</span>
            <span className="text-xs font-bold text-charcoal bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-300">
              {user?.name?.replace(/\s*\(Admin\)/gi, '')} (Admin)
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

