
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Payment from '../models/Payment.js';
import { sendInstagramNotification } from '../utils/instagramService.js';
import { transitionOrder } from '../utils/orderLifecycle.js';
import crypto from 'crypto';

const generateConciergeCode = () => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DEUZ-${yy}${mm}-${randomSuffix}`;
};

// @desc    Track Order Status (Public, Rate Limited)
// @route   GET /api/orders/track/:code
export const trackOrder = async (req, res) => {
    const { code } = req.params;
    
    try {
        // Try finding by code first, fallback to ID if code matches objectId format (rare case handling)
        let order = await Order.findOne({ conciergeCode: code })
            .select('conciergeCode totalAmount orderStatus contactMethod items shippingAddress paymentLink');

        if (!order) {
             // Handle case where frontend might send ID in URL for tracking
             if (code.match(/^[0-9a-fA-F]{24}$/)) {
                 order = await Order.findById(code)
                    .select('conciergeCode totalAmount orderStatus contactMethod items shippingAddress paymentLink');
             }
        }

        if (!order) {
            return res.status(404).json({ message: 'Dossier not found' });
        }

        res.json({
            _id: order._id,
            code: order.conciergeCode,
            total: order.totalAmount,
            status: order.orderStatus,
            contactMethod: order.contactMethod,
            items: order.items,
            address: order.shippingAddress,
            paymentLink: order.paymentLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Tracking service unavailable' });
    }
};

// @desc    Process Public Payment
// @route   POST /api/orders/:id/pay
export const processPayment = async (req, res, next) => {
    try {
        const { paymentDetails } = req.body; 
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (order.paymentStatus === 'Paid') {
            return res.json({ success: true, message: 'Already Paid' });
        }

        const transactionId = `TXN_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        await Payment.create({
            order: order._id,
            method: 'Secure Payment Link',
            amount: order.totalAmount,
            status: 'Verified',
            referenceId: transactionId,
            recordedBy: order.user, 
            adminNote: 'Public Portal Payment'
        });

        order.paymentStatus = 'Paid';
        
        await transitionOrder(order, 'PAYMENT_AUTHORIZED', 'System', `Online Payment: ${transactionId}`);
        
        await order.save();

        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product && product.productType === 'APPAREL') {
                if (product.countInStock > 0) {
                    product.countInStock = 0; 
                    await product.save();
                }
            }
        }

        res.json({
            success: true,
            transactionId,
            orderStatus: order.orderStatus
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Create Concierge Order
// @route   POST /api/orders/concierge
export const createConciergeOrder = async (req, res, next) => {
    try {
        const { items, address, contactMethod } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No artifacts selected');
        }

        let calcTotal = 0;
        const finalItems = [];

        // 1. Atomic Stock Reservation (Strict Enforcement)
        for (const item of items) {
            const productId = item.id || item.product;
            
            // Atomic update: Only decrement if stock >= requested quantity
            const product = await Product.findOneAndUpdate(
                { _id: productId, countInStock: { $gte: item.quantity } },
                { $inc: { countInStock: -item.quantity } },
                { new: true } 
            );
            
            if (!product) {
                res.status(400);
                throw new Error(`Allocation failed for ${item.title}. Item is no longer available.`);
            }

            calcTotal += product.price * item.quantity;
            
            finalItems.push({
                product: product._id,
                title: product.title,
                quantity: item.quantity,
                price: product.price,
                image: product.image,
                selectedSize: item.selectedSize
            });
        }

        // 2. Create Order Dossier
        const order = new Order({
            user: req.user ? req.user._id : undefined, 
            conciergeCode: generateConciergeCode(),
            items: finalItems,
            totalAmount: calcTotal,
            shippingAddress: address,
            contactMethod: contactMethod || 'instagram',
            paymentStatus: 'Pending',
            orderStatus: 'ORDER_SECURED'
        });

        const createdOrder = await order.save();

        // 3. Clear Cart (if user exists)
        if (req.user) {
            await Cart.findOneAndDelete({ user: req.user._id });
        }

        // 4. Notify System
        sendInstagramNotification(
            createdOrder.conciergeCode,
            address.fullName,
            address.city,
            calcTotal,
            finalItems.length,
            contactMethod
        ).catch(console.error);

        res.status(201).json({
            success: true,
            orderId: createdOrder._id,
            orderCode: createdOrder.conciergeCode,
            order: {
                items: finalItems,
                shippingAddress: address,
                totalAmount: calcTotal
            },
            message: 'Dossier Registered'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Start/Record Conversation
// @route   POST /api/orders/:id/conversation
export const startOrderConversation = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (!order.conversationStartedAt) {
            order.conversationStartedAt = Date.now();
        }
        
        if (req.body.interaction) {
            order.externalInteractions.push({
                ...req.body.interaction,
                timestamp: Date.now()
            });
        }

        await order.save();
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// @desc    Update Communication Channel
// @route   PUT /api/orders/:id/channel
export const updateOrderChannel = async (req, res, next) => {
    try {
        const { channel } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (order) {
            order.contactMethod = channel;
            await order.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel Order (Admin/Concierge Only)
// @route   POST /api/orders/cancel
export const cancelOrder = async (req, res, next) => {
    try {
        const { orderId, reason } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (order.orderStatus !== 'CANCELLED') {
            for (const item of order.items) {
                // Atomic increment to return stock
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { countInStock: item.quantity } }
                );
            }
        }

        await transitionOrder(order, 'CANCELLED', req.user._id, reason || 'Admin Cancelled');
        await order.save();

        res.json({ message: 'Order Cancelled & Inventory Restocked', order });
    } catch (error) {
        next(error);
    }
};
