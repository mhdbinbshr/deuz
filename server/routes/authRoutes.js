import express from 'express';
import { authUser, registerUser, googleAuth } from '../controllers/authController.js';
import { validateLogin, validateSignup } from '../middleware/validatorMiddleware.js';

const router = express.Router();

router.post('/login', validateLogin, authUser);
router.post('/signup', validateSignup, registerUser);
router.post('/google', googleAuth);

export default router;