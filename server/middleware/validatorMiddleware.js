import { body, validationResult } from 'express-validator';

// Standard error handler for validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
        message: 'Validation Error', 
        errors: errors.array().map(err => err.msg) 
    });
  }
  next();
};

export const validateLogin = [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

export const validateSignup = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('mobile').optional().isMobilePhone().withMessage('Invalid mobile number'),
    validate
];

export const validateOrderCreate = [
    body('items').isArray({ min: 1 }).withMessage('Order items cannot be empty'),
    // Support 'id' or 'product' as the key for product identifier
    body('items.*').custom((item) => {
        if (!item.id && !item.product) {
            throw new Error('Product ID is missing in item');
        }
        return true;
    }),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Invalid total amount'),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Shipping name is required'),
    body('shippingAddress.house').trim().notEmpty().withMessage('Address line 1 is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required').isLength({ min: 4, max: 10 }),
    validate
];

export const validateProduct = [
    body('title').trim().notEmpty().withMessage('Product title is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('productType').optional().isIn(['APPAREL', 'CARD']).withMessage('Invalid product type'),
    body('countInStock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('image').trim().notEmpty().withMessage('Image URL is required'),
    validate
];

export const validateAddToCart = [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('selectedSize').optional().isString(),
    validate
];

export const validateMergeCart = [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.id').notEmpty().withMessage('Item ID required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    validate
];