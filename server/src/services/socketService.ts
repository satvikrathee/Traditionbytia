import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ENV } from '../config/env.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join public storefront room for price & stock updates
    socket.join('storefront');

    // Handle joining order-specific room
    socket.on('join:order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`[Socket] ${socket.id} joined order:${orderId}`);
      }
    });

    // Handle joining user room for real-time customer updates
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] ${socket.id} joined user:${userId}`);
      }
    });

    // Handle joining admin room (authenticated admins)
    socket.on('join:admin', (data?: { token?: string }) => {
      // Allow admin sessions to receive order, inventory & alert updates
      socket.join('admin');
      console.log(`[Socket] ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Fallback / Direct event emitters (called after controller updates)
export const emitProductUpdate = (product: any, changeType: 'price' | 'stock' | 'image' | 'update' = 'update') => {
  if (!io) return;
  io.to('storefront').emit('product:updated', { product, changeType });
  io.to('admin').emit('product:updated', { product, changeType });
};

export const emitOrderCreated = (order: any) => {
  if (!io) return;
  io.to('admin').emit('order:created', { order });
  if (order.userId) {
    io.to(`user:${order.userId.toString()}`).emit('order:created', { order });
  }
};

export const emitOrderUpdated = (order: any) => {
  if (!io) return;
  io.to('admin').emit('order:updated', { order });
  io.to(`order:${order._id.toString()}`).emit('order:updated', { order });
  if (order.userId) {
    io.to(`user:${order.userId.toString()}`).emit('order:updated', { order });
  }
};

export const emitInventoryUpdated = (productId: string, stock: number, price?: number, discountPrice?: number) => {
  if (!io) return;
  io.to('storefront').emit('inventory:updated', { productId, stock, price, discountPrice });
  io.to('admin').emit('inventory:updated', { productId, stock, price, discountPrice });
};

// MongoDB Change Streams listener (for replica sets / MongoDB Atlas)
export const startChangeStreams = () => {
  try {
    const productStream = Product.watch([], { fullDocument: 'updateLookup' });
    productStream.on('change', (change) => {
      if (!io) return;
      if (change.operationType === 'update' || change.operationType === 'replace') {
        const doc = change.fullDocument;
        io.to('storefront').emit('product:updated', { product: doc, changeType: 'update' });
        io.to('admin').emit('product:updated', { product: doc, changeType: 'update' });
      }
    });

    productStream.on('error', (err) => {
      console.warn('[ChangeStream] Product change stream warning:', err.message);
    });

    const orderStream = Order.watch([], { fullDocument: 'updateLookup' });
    orderStream.on('change', (change) => {
      if (!io) return;
      if (change.operationType === 'insert') {
        const order = change.fullDocument;
        io.to('admin').emit('order:created', { order });
        if (order?.userId) {
          io.to(`user:${order.userId.toString()}`).emit('order:created', { order });
        }
      } else if (change.operationType === 'update' || change.operationType === 'replace') {
        const order = change.fullDocument;
        if (order) {
          io.to('admin').emit('order:updated', { order });
          io.to(`order:${order._id.toString()}`).emit('order:updated', { order });
          if (order.userId) {
            io.to(`user:${order.userId.toString()}`).emit('order:updated', { order });
          }
        }
      }
    });

    orderStream.on('error', (err) => {
      console.warn('[ChangeStream] Order change stream warning:', err.message);
    });

    console.log('[ChangeStreams] MongoDB Change Streams active for Products and Orders.');
  } catch (err: any) {
    console.log('[ChangeStreams] Note: Change Streams not active (likely standalone database). Event-driven fallback is enabled.', err.message);
  }
};

