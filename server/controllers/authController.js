
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        addresses: user.addresses || [],
        mobile: user.mobile,
        joinedDate: user.createdAt
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
export const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, mobile } = req.body;
    
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Password hashing handled by pre-save hook in Mongoose model
    const user = await User.create({
      fullName,
      email,
      password,
      mobile,
      addresses: []
    });

    if (user) {
      res.status(201).json({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        mobile: user.mobile,
        joinedDate: user.createdAt
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login/Register with Google
// @route   POST /api/auth/google
export const googleAuth = async (req, res, next) => {
    try {
        const { email, name } = req.body;
        
        let user = await User.findOne({ email });

        if (user) {
            // User exists, log them in
            res.json({
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                addresses: user.addresses,
                mobile: user.mobile,
                joinedDate: user.createdAt
            });
        } else {
            // Register new user with random password
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                fullName: name,
                email: email,
                password: randomPassword
            });

            if (user) {
                res.status(201).json({
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                    mobile: user.mobile,
                    joinedDate: user.createdAt
                });
            } else {
                res.status(400);
                throw new Error('Invalid user data');
            }
        }
    } catch (error) {
        next(error);
    }
};
