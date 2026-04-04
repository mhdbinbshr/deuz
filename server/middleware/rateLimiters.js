import { rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window`
	standardHeaders: 'draft-7',
	legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

export const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 10, // Limit login/signup attempts
	message: { message: 'Too many login attempts, please try again after an hour.' }
});

export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20, // Strict limit on payment creation/verification
    message: { message: 'Payment processing limit reached.' }
});

// ULTRA-PREMIUM SECURITY: Silent protection
// Prevents spamming the concierge desk without breaking the immersion.
export const conciergeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // Strict: 5 requests per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        // 1. Fail Quietly: Log the spam attempt for admin review
        console.warn(`[Security Alert] Concierge Spam blocked from IP: ${req.ip}`);
        
        // 2. Luxury Reassurance: Return a message that sounds like high-demand, not a block.
        res.status(options.statusCode).json({
            message: 'Our curators are currently reviewing your existing dossiers. Please allow us a moment before submitting another request.'
        });
    }
});