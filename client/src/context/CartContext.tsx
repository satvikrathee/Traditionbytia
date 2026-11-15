'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  loading: boolean;
  addToCart: (product: Product, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load cart from DB for logged in user or localStorage for guest
  const refreshCart = useCallback(async () => {
    if (authLoading) return;

    if (isAuthenticated) {
      try {
        const res = await api.get('/cart');
        if (res.success && res.cart?.items) {
          // Filter out items whose product may be null
          const validItems: CartItem[] = res.cart.items.filter(
            (i: any) => i.productId && typeof i.productId === 'object'
          );
          setItems(validItems);
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart in localStorage
      try {
        const raw = localStorage.getItem('tiya_guest_cart');
        if (raw) {
          const guestList = JSON.parse(raw);
          // Fetch populated product data for guest items
          if (Array.isArray(guestList) && guestList.length > 0) {
            const populated = await Promise.all(
              guestList.map(async (g: any) => {
                try {
                  const pRes = await api.get(`/products/${g.productId}`);
                  if (pRes.success && pRes.product) {
                    return { productId: pRes.product, qty: g.qty };
                  }
                  return null;
                } catch {
                  return null;
                }
              })
            );
            setItems(populated.filter(Boolean) as CartItem[]);
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Real-time stock and price updates listener for cart items
  useEffect(() => {
    const socket = getSocket();

    const handleInventoryUpdate = (data: {
      productId: string;
      stock: number;
      price?: number;
      discountPrice?: number;
    }) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.productId?._id === data.productId) {
            const updatedProduct = {
              ...item.productId,
              stock: data.stock,
              ...(data.price !== undefined ? { price: data.price } : {}),
              ...(data.discountPrice !== undefined ? { discountPrice: data.discountPrice } : {}),
            };
            return {
              ...item,
              productId: updatedProduct,
              qty: Math.min(item.qty, Math.max(1, data.stock)),
            };
          }
          return item;
        })
      );
    };

    socket.on('inventory:updated', handleInventoryUpdate);
    return () => {
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, []);

  const addToCart = async (product: Product, qty = 1) => {
    if (product.stock < 1) {
      toast.error('Sorry, this product is currently out of stock.');
      return;
    }

    if (isAuthenticated) {
      try {
        const res = await api.post('/cart/add', { productId: product._id, qty });
        if (res.success && res.cart?.items) {
          setItems(res.cart.items.filter((i: any) => i.productId && typeof i.productId === 'object'));
          toast.success(`Added ${product.name} to cart`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to add item');
      }
    } else {
      // Guest local storage
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId._id === product._id);
        let next: CartItem[];
        if (existingIdx > -1) {
          next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            qty: Math.min(product.stock, next[existingIdx].qty + qty),
          };
        } else {
          next = [...prev, { productId: product, qty: Math.min(product.stock, qty) }];
        }
        localStorage.setItem(
          'tiya_guest_cart',
          JSON.stringify(next.map((n) => ({ productId: n.productId._id, qty: n.qty })))
        );
        return next;
      });
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const updateQty = async (productId: string, qty: number) => {
    if (isAuthenticated) {
      try {
        const res = await api.put('/cart/update', { productId, qty });
        if (res.success && res.cart?.items) {
          setItems(res.cart.items.filter((i: any) => i.productId && typeof i.productId === 'object'));
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to update quantity');
      }
    } else {
      setItems((prev) => {
        let next: CartItem[];
        if (qty <= 0) {
          next = prev.filter((i) => i.productId._id !== productId);
        } else {
          next = prev.map((i) =>
            i.productId._id === productId ? { ...i, qty: Math.min(i.productId.stock, qty) } : i
          );
        }
        localStorage.setItem(
          'tiya_guest_cart',
          JSON.stringify(next.map((n) => ({ productId: n.productId._id, qty: n.qty })))
        );
        return next;
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (isAuthenticated) {
      try {
        const res = await api.delete(`/cart/item/${productId}`);
        if (res.success && res.cart?.items) {
          setItems(res.cart.items.filter((i: any) => i.productId && typeof i.productId === 'object'));
          toast.success('Item removed from cart');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to remove item');
      }
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId._id !== productId);
        localStorage.setItem(
          'tiya_guest_cart',
          JSON.stringify(next.map((n) => ({ productId: n.productId._id, qty: n.qty })))
        );
        return next;
      });
      toast.success('Item removed from cart');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart/clear');
        setItems([]);
      } catch {}
    } else {
      localStorage.removeItem('tiya_guest_cart');
      setItems([]);
    }
  };

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const p = item.productId;
        if (!p) return sum;
        const effectivePrice = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
        return sum + effectivePrice * item.qty;
      }, 0),
    [items]
  );

  const shippingFee = useMemo(() => (subtotal >= 1499 || subtotal === 0 ? 0 : 99), [subtotal]);
  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        total,
        loading,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

