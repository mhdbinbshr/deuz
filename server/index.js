
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();

  // ES Module fix for __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  // Logging
  app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
          console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
      }
      next();
  });

  // Health and System Info
  app.use('/api', globalLimiter);
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DEUZ & CO Backend',
      dataLayer: 'Firebase Firestore & Firebase Authentication',
      timestamp: new Date().toISOString()
    });
  });

  // Authentication API Routes
  app.use('/api/auth', authRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve Static Frontend (Production)
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    // Handle React Routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  const PORT = 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
