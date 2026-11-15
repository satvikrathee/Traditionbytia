'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Address } from '../types';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  sendSignupOtp: (name: string, email: string, password: string, phone?: string) => Promise<any>;
  verifySignupOtp: (email: string, otp: string) => Promise<User | null>;
  sendLoginOtp: (email: string) => Promise<any>;
  verifyLoginOtp: (email: string, otp: string) => Promise<User | null>;
  loginWithGoogle: (credential: { email?: string; name?: string; googleId?: string; credential?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  addAddress: (address: Omit<Address, '_id'>) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        const socket = getSocket();
        socket.emit('join:user', res.user._id);
        if (res.user.role === 'admin') {
          socket.emit('join:admin');
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user._id);
      if (res.user.role === 'admin') {
        socket.emit('join:admin');
      }

      // Sync any guest cart from localStorage
      const guestCartRaw = localStorage.getItem('tiya_guest_cart');
      if (guestCartRaw) {
        try {
          const guestItems = JSON.parse(guestCartRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            await api.post('/cart/sync', { guestItems });
            localStorage.removeItem('tiya_guest_cart');
          }
        } catch (e) {
          console.error('Error syncing guest cart:', e);
        }
      }
      return res.user;
    }
    return null;
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user._id);
    }
  };

  const sendSignupOtp = async (name: string, email: string, password: string, phone?: string) => {
    return await api.post('/auth/send-signup-otp', { name, email, password, phone });
  };

  const verifySignupOtp = async (email: string, otp: string): Promise<User | null> => {
    const res = await api.post('/auth/verify-signup-otp', { email, otp });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user._id);
      if (res.user.role === 'admin') {
        socket.emit('join:admin');
      }

      // Sync guest cart
      const guestCartRaw = localStorage.getItem('tiya_guest_cart');
      if (guestCartRaw) {
        try {
          const guestItems = JSON.parse(guestCartRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            await api.post('/cart/sync', { guestItems });
            localStorage.removeItem('tiya_guest_cart');
          }
        } catch (e) {
          console.error('Error syncing guest cart:', e);
        }
      }
      return res.user;
    }
    return null;
  };

  const sendLoginOtp = async (email: string) => {
    return await api.post('/auth/send-login-otp', { email });
  };

  const verifyLoginOtp = async (email: string, otp: string): Promise<User | null> => {
    const res = await api.post('/auth/verify-login-otp', { email, otp });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user._id);
      if (res.user.role === 'admin') {
        socket.emit('join:admin');
      }
      return res.user;
    }
    return null;
  };

  const loginWithGoogle = async (credential: { email?: string; name?: string; googleId?: string; credential?: string }) => {
    const res = await api.post('/auth/google', credential);
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user._id);

      // Sync guest cart
      const guestCartRaw = localStorage.getItem('tiya_guest_cart');
      if (guestCartRaw) {
        try {
          const guestItems = JSON.parse(guestCartRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            await api.post('/cart/sync', { guestItems });
            localStorage.removeItem('tiya_guest_cart');
          }
        } catch (e) {
          console.error('Error syncing guest cart:', e);
        }
      }
      return res.user;
    }
    return null;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    const res = await api.put('/auth/profile', data);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const addAddress = async (address: Omit<Address, '_id'>) => {
    const res = await api.post('/auth/address', address);
    if (res.success && res.addresses) {
      setUser((prev) => (prev ? { ...prev, addresses: res.addresses } : null));
    }
  };

  const deleteAddress = async (addressId: string) => {
    const res = await api.delete(`/auth/address/${addressId}`);
    if (res.success && res.addresses) {
      setUser((prev) => (prev ? { ...prev, addresses: res.addresses } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        sendSignupOtp,
        verifySignupOtp,
        sendLoginOtp,
        verifyLoginOtp,
        loginWithGoogle,
        logout,
        updateProfile,
        addAddress,
        deleteAddress,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

