import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { 
  getUsers,
  createUser, 
  getAllOrders, 
  updateOrderStatus,
  generatePaymentLink,
  recordManualPayment,
  getSystemSettings,
  updateSystemSettings,
  bootstrapAdmin,
  getAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

// --- PUBLIC (or Special Access) ---

// CMS Settings (Guest Read)
router.get('/settings', getSystemSettings);

// Admin Bootstrap (Protected by Key, Publicly Reachable)
router.post('/bootstrap', bootstrapAdmin);

// --- PROTECTED AREA ---
router.use(protect); // All subsequent routes require valid JWT

// --- TIER 1: SYSTEM ADMIN (Strict Access) ---
router.get('/users', adminOnly, getUsers);
router.post('/users', adminOnly, createUser);
router.put('/settings', adminOnly, updateSystemSettings);
router.get('/audit', adminOnly, getAuditLogs);

// Order Management - Restricted to Admin as per strict security rules
router.get('/orders', adminOnly, getAllOrders);
router.put('/orders/:id', adminOnly, updateOrderStatus);
router.post('/orders/:id/payment-link', adminOnly, generatePaymentLink);
router.post('/orders/:id/payment', adminOnly, recordManualPayment);

export default router;