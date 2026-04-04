import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem,
  mergeCart 
} from '../controllers/cartController.js';
import { validateAddToCart, validateMergeCart } from '../middleware/validatorMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCart)
  .post(protect, validateAddToCart, addToCart);

router.post('/merge', protect, validateMergeCart, mergeCart);

router.route('/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

export default router;