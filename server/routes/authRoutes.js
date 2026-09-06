import express from 'express';
import { 
  authUser, 
  registerUser, 
  googleAuth, 
  getMe, 
  updateProfile, 
  forgotPassword 
} from '../controllers/authController.js';
import { validateLogin, validateSignup } from '../middleware/validatorMiddleware.js';

const router = express.Router();

router.post('/login', validateLogin, authUser);
router.post('/signup', validateSignup, registerUser);
router.post('/google', googleAuth);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/forgot-password', forgotPassword);

export default router;
