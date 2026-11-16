import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { ENV } from './config/env.js';
import { connectDB, getIsChangeStreamSupported } from './config/db.js';
import { initSocket, startChangeStreams } from './services/socketService.js';
import { initEmailTransporter } from './services/emailService.js';
import { initCloudinary } from './services/storageService.js';
import { initRazorpay } from './services/paymentService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security Headers & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all general API calls
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    name: 'Traditions By Tiya API Server',
    environment: ENV.NODE_ENV,
    changeStreamsActive: getIsChangeStreamSupported(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);

// Catch-all 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

// Bootstrap Server & Services
const startServer = async () => {
  try {
    await connectDB();
    initEmailTransporter();
    initCloudinary();
    initRazorpay();
    startChangeStreams();

    server.listen(ENV.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  TRADITIONS BY TIYA - BACKEND SERVER RUNNING`);
      console.log(`  Port: ${ENV.PORT}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  Client Origin: ${ENV.CLIENT_URL}`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, server };

