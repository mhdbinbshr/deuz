import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  cancelOrder,
  getMyOrders,
  createConciergeOrder,
  startOrderConversation,
  updateOrderChannel,
  trackOrder,
  processPayment
} from '../controllers/orderController.js';
import { conciergeLimiter, paymentLimiter } from '../middleware/rateLimiters.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// --- CONCIERGE WORKFLOW (Manual / High-Touch) ---

// Create Dossier (Initial Request)
router.post('/concierge', conciergeLimiter, createConciergeOrder); 

// Concierge Interactions
router.post('/:id/conversation', conciergeLimiter, startOrderConversation);
router.put('/:id/channel', conciergeLimiter, updateOrderChannel);

// Public Order Tracking (System Truth)
router.get('/track/:code', conciergeLimiter, trackOrder);

// Public Payment Processing (From Secure Link)
router.post('/:id/pay', paymentLimiter, processPayment);

// User History
router.get('/myorders', protect, getMyOrders);

// Admin / Concierge Controls
router.post('/cancel', protect, adminOnly, cancelOrder);

export default router;