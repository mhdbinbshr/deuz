
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import SystemSettings from '../models/SystemSettings.js';
import AuditLog from '../models/AuditLog.js';
import { transitionOrder } from '../utils/orderLifecycle.js';

// Helper for Logging
const logAdminAction = async (req, action, targetResource, targetId, details) => {
    try {
        await AuditLog.create({
            action,
            performedBy: req.user._id,
            targetResource,
            targetId: String(targetId),
            details,
            ipAddress: req.ip
        });
    } catch (e) {
        console.error('Audit Log Failed:', e);
    }
};

// @desc    Bootstrap First Admin (Secure Setup)
// @route   POST /api/admin/bootstrap
export const bootstrapAdmin = async (req, res, next) => {
    try {
        const { setupKey, email, password, fullName } = req.body;

        // 1. Verify Setup Key
        const SERVER_KEY = process.env.ADMIN_SETUP_KEY || 'deuz_setup_2024';

        if (setupKey !== SERVER_KEY) {
            return res.status(401).json({ message: 'Access Denied: Invalid Bootstrap Key' });
        }

        // 3. Ensure No Admin Exists (Lockout Rule)
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(410).json({ message: "Bootstrap Disabled: System already initialized." });
        }

        // 4. Create Admin
        const user = await User.create({
            fullName: fullName || 'System Admin',
            email,
            password, // Password hashing handled by pre-save
            role: 'admin',
            mobile: req.body.mobile || ''
        });

        if (user) {
            console.log(`[System] Root Admin initialized: ${user.email}`);
            
            // Generate Token for Auto-Login
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.status(201).json({
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: token,
                message: 'System bootstrapped successfully.'
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data during bootstrap');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/admin/users
export const createUser = async (req, res, next) => {
    try {
        const { fullName, email, password, role, mobile } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            fullName,
            email,
            password, 
            role: role || 'user',
            mobile
        });

        if (user) {
            await logAdminAction(req, 'CREATE_USER', 'User', user._id, { email, role });
            
            res.status(201).json({
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status or internal notes
// @route   PUT /api/admin/orders/:id
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, internalNotes } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      const previousStatus = order.orderStatus;

      // 1. Update Status (Lifecycle)
      if (status && status !== order.orderStatus) {
          try {
              await transitionOrder(order, status, req.user._id, 'Admin Manual Update');
              await logAdminAction(req, 'UPDATE_ORDER_STATUS', 'Order', order._id, { from: previousStatus, to: status });
          } catch (e) {
              res.status(400);
              throw new Error(e.message);
          }
          
          // --- STOCK LOGIC ---
          // Case 1: Cancelled -> Return Stock
          if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
              for (const item of order.items) {
                  if (item.product) {
                      await Product.findByIdAndUpdate(
                          item.product,
                          { $inc: { countInStock: item.quantity } }
                      );
                  }
              }
          }

          // Case 2: Payment Confirmed -> Ensure Stock is 0 for 1-of-1
          if (status === 'PAYMENT_AUTHORIZED') {
              order.paymentStatus = 'Paid';
              
              for (const item of order.items) {
                  if (item.product) {
                      const product = await Product.findById(item.product);
                      if (product && product.productType === 'APPAREL') {
                          if (product.countInStock > 0) {
                              await Product.findByIdAndUpdate(item.product, { countInStock: 0 });
                          }
                      }
                  }
              }
          }
      }

      // 2. Update Internal Notes
      if (internalNotes !== undefined) {
          order.internalNotes = internalNotes;
      }

      await order.save();
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Record Manual Payment (Admin Only)
// @route   POST /api/admin/orders/:id/payment
export const recordManualPayment = async (req, res, next) => {
    try {
        const { amount, method, referenceId, note } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        const payment = await Payment.create({
            order: order._id,
            method,
            amount,
            status: 'Verified',
            referenceId,
            recordedBy: req.user._id,
            adminNote: note
        });

        await logAdminAction(req, 'RECORD_PAYMENT', 'Payment', payment._id, { amount, method, orderCode: order.conciergeCode });

        if (order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Paid';
            try {
                await transitionOrder(order, 'PAYMENT_AUTHORIZED', req.user._id, `Manual Payment: ${method} - ${referenceId}`);
            } catch (e) {
                console.warn(e.message);
                order.orderStatus = 'PAYMENT_AUTHORIZED';
            }
            
            await order.save();

            for (const item of order.items) {
                if (item.product) {
                    const product = await Product.findById(item.product);
                    if (product && product.productType === 'APPAREL') {
                        if (product.countInStock > 0) {
                            await Product.findByIdAndUpdate(item.product, { countInStock: 0 });
                        }
                    }
                }
            }
        }

        res.status(201).json({
            success: true,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Generate Private Payment Link (No Status Change)
// @route   POST /api/admin/orders/:id/payment-link
export const generatePaymentLink = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        const secureLink = `https://deuz.co/pay/secure/${order._id}?code=${order.conciergeCode || 'private'}`;
        
        await logAdminAction(req, 'GENERATE_PAYMENT_LINK', 'Order', order._id, { link: secureLink });

        order.paymentLink = secureLink;
        await order.save();

        res.json({
            success: true,
            paymentLink: secureLink,
            orderId: order._id,
            status: order.orderStatus
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get System Settings
// @route   GET /api/admin/settings
export const getSystemSettings = async (req, res, next) => {
    try {
        // Find default or create if empty
        let settings = await SystemSettings.findOne({ key: 'global_config' });
        if (!settings) {
            settings = await SystemSettings.create({ key: 'global_config' });
        }
        res.json(settings);
    } catch (error) {
        next(error);
    }
};

// @desc    Update System Settings
// @route   PUT /api/admin/settings
export const updateSystemSettings = async (req, res, next) => {
    try {
        const { conciergeConfig, siteContent } = req.body;
        
        let settings = await SystemSettings.findOne({ key: 'global_config' });
        if (!settings) {
            settings = new SystemSettings({ key: 'global_config' });
        }
        
        if (conciergeConfig) {
            settings.conciergeConfig = { ...settings.conciergeConfig, ...conciergeConfig };
        }
        
        if (siteContent) {
            settings.siteContent = { ...settings.siteContent, ...siteContent };
        }
        
        await settings.save();
        await logAdminAction(req, 'UPDATE_SETTINGS', 'SystemSettings', settings._id, { updatedFields: Object.keys(req.body) });
        
        res.json(settings);
    } catch (error) {
        next(error);
    }
};

// @desc    Get System Audit Logs
// @route   GET /api/admin/audit
export const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('performedBy', 'fullName email');
        res.json(logs);
    } catch (error) {
        next(error);
    }
};
