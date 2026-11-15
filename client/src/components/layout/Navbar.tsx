'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  Menu,
  X,
  Shield,
  Package,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'All Products', href: '/shop' },
    { name: 'Our Story', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-cream-400">
      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal hover:text-maroon-500 focus:outline-none"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo Wordmark */}
          <div className="flex-1 lg:flex-initial text-center lg:text-left">
            <Link href="/" className="inline-block group py-1">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-wider text-maroon-600 group-hover:text-maroon-700 transition-colors">
                Traditions
              </span>
              <span className="font-serif text-lg md:text-xl italic font-normal text-gold-600 mx-1.5">
                By
              </span>
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-wider text-maroon-600 group-hover:text-maroon-700 transition-colors">
                Tiya
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-charcoal">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors py-1 ${
                    isActive
                      ? 'text-maroon-600 font-bold border-b-2 border-gold-500'
                      : 'text-charcoal-light hover:text-maroon-600 font-medium'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-charcoal hover:text-maroon-500 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Account Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-1.5 p-1.5 rounded-full hover:bg-cream-200 transition-colors text-charcoal"
                    aria-label="User account"
                  >
                    <div className="w-8 h-8 rounded-full bg-maroon-500 text-cream-100 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-royal border border-cream-400 py-2 z-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-cream-300">
                        <p className="text-sm font-semibold text-charcoal truncate">{user?.name}</p>
                        <p className="text-xs text-charcoal-muted truncate">{user?.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-maroon-600 hover:bg-cream-100 font-medium"
                        >
                          <Shield className="w-4 h-4 mr-2.5 text-gold-600" />
                          Admin Portal
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 text-sm text-charcoal hover:bg-cream-100"
                      >
                        <Package className="w-4 h-4 mr-2.5 text-charcoal-muted" />
                        My Orders
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-charcoal hover:bg-cream-100"
                      >
                        <UserIcon className="w-4 h-4 mr-2.5 text-charcoal-muted" />
                        Profile & Addresses
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-cream-200 mt-1"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center text-sm font-medium text-charcoal hover:text-maroon-500 transition-colors px-2.5 py-1 rounded-md"
                >
                  <UserIcon className="w-5 h-5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-charcoal hover:text-maroon-500 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-maroon-600 text-cream-100 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar Flyout */}
        {searchOpen && (
          <div className="py-3 px-2 border-t border-cream-300">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search Banarasi sarees, zardozi lehengas, temple jewellery, pashmina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-24 py-2.5 bg-cream-100 border border-gold-400/60 rounded-lg text-sm text-charcoal placeholder-charcoal-muted focus:outline-none focus:ring-2 focus:ring-maroon-500"
              />
              <Search className="absolute left-3 w-4 h-4 text-gold-600" />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 bg-maroon-600 hover:bg-maroon-700 text-cream-100 text-xs font-semibold rounded-md transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Slide-down Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-t border-cream-400 px-5 pt-4 pb-8 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated && (
            <div className="pb-3 border-b border-cream-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-maroon-900">{user?.name}</p>
                <p className="text-xs text-charcoal-muted truncate max-w-[200px]">{user?.email}</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-gold-700 bg-gold-100 px-2 py-0.5 rounded">
                {isAdmin ? 'Admin' : 'Patron'}
              </span>
            </div>
          )}

          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? 'bg-maroon-50 text-maroon-700 font-bold'
                    : 'text-charcoal hover:bg-cream-100 hover:text-maroon-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-cream-200 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-charcoal hover:bg-cream-100"
                >
                  <Package className="w-4 h-4 text-charcoal-muted" />
                  My Orders
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold text-maroon-950 bg-gradient-to-r from-gold-400 to-gold-500 rounded-xl shadow-xs"
                  >
                    <Shield className="w-4 h-4 text-maroon-900" />
                    Admin Control Room
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 py-2.5 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-maroon-700 to-maroon-600 text-cream-100 text-center font-bold text-xs uppercase tracking-wider rounded-xl shadow-royal flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-gold-400" />
                Sign In to Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

