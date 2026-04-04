import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validateProduct } from '../middleware/validatorMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, adminOnly, validateProduct, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, validateProduct, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;