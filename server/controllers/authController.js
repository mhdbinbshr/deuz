import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'deuz-luxury-cinematic-jwt-secret-key-2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const ADMIN_EMAILS = [
  'unk410066@gmail.com',
  'muhammadbinbasheer777@gmail.com'
];

// Helper: extract client network metadata
const getClientMeta = (req) => {
  const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || req?.ip || '127.0.0.1';
  const userAgent = req?.headers?.['user-agent'] || 'Deuz-Client/1.0';
  return { ip, userAgent };
};

// Helper: log audit, authentication, and system events to Firebase Firestore
const logFirebaseAuthEvent = async ({
  action,
  event,
  email,
  userId,
  role = 'user',
  provider = 'email',
  status = 'success',
  failureReason = null,
  message,
  level = 'info',
  details = {},
  req = null
}) => {
  const { ip, userAgent } = getClientMeta(req);
  const timestamp = new Date().toISOString();
  const normalizedAction = action || event || 'AUTH_EVENT';

  // 1. Write to auth_logs collection on Firebase Console
  try {
    await addDoc(collection(db, 'auth_logs'), {
      event: (event || normalizedAction).toLowerCase(),
      email: email || '',
      userId: String(userId || ''),
      role: role || 'user',
      provider: provider || 'email',
      status,
      failureReason: failureReason || null,
      ip,
      userAgent,
      timestamp,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firebase auth_logs write warning:', err.message);
  }

  // 2. Write to logs collection on Firebase Console
  try {
    await addDoc(collection(db, 'logs'), {
      level: status === 'failed' ? 'warn' : level,
      category: 'auth',
      message: message || `${normalizedAction} - ${email || 'guest'} [${status.toUpperCase()}]`,
      action: normalizedAction,
      userId: String(userId || ''),
      userEmail: email || '',
      ip,
      userAgent,
      metadata: { ...details, status, failureReason, provider },
      timestamp,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firebase logs write warning:', err.message);
  }

  // 3. Write to audit_logs collection on Firebase Console
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action: normalizedAction,
      targetResource: 'users',
      targetId: String(userId || email || ''),
      details: { ...details, email, status, failureReason, ip, userAgent },
      performedBy: {
        fullName: details?.fullName || (email ? email.split('@')[0] : 'System Auth'),
        email: email || 'auth@deuz.co',
        uid: String(userId || 'auth')
      },
      timestamp,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firebase audit_logs write warning:', err.message);
  }
};

// Legacy fallback wrapper
const logAudit = async (action, targetId, details, performedBy) => {
  await logFirebaseAuthEvent({
    action,
    userId: targetId,
    email: details?.email || performedBy?.email,
    details,
    message: `${action} on user ${targetId || details?.email || ''}`
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { ip } = getClientMeta(req);
    
    if (!email || !password) {
      await logFirebaseAuthEvent({
        action: 'USER_LOGIN_FAILED',
        event: 'login_failure',
        email: email || 'unknown',
        status: 'failed',
        failureReason: 'Email and password required',
        level: 'warn',
        req
      });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query Firestore for user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    let userDoc = null;
    let userId = null;
    let userData = null;

    if (!querySnapshot.empty) {
      userDoc = querySnapshot.docs[0];
      userId = userDoc.id;
      userData = userDoc.data();
    }

    // Auto-bootstrap admin account if not created yet
    if (!userData && ADMIN_EMAILS.includes(normalizedEmail)) {
      userId = 'admin_' + crypto.randomBytes(6).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const newAdminData = {
        fullName: 'Executive Operator',
        email: normalizedEmail,
        mobile: '',
        role: 'admin',
        passwordHash,
        authProvider: 'email',
        addresses: [],
        lastLoginIp: ip,
        loginCount: 1,
        status: 'active',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userId), newAdminData);
      await logFirebaseAuthEvent({
        action: 'ADMIN_AUTO_INITIALIZED',
        event: 'admin_bootstrap',
        email: normalizedEmail,
        userId,
        role: 'admin',
        provider: 'email',
        status: 'success',
        message: `Root executive admin automatically initialized on Firebase Console: ${normalizedEmail}`,
        details: { email: normalizedEmail, fullName: 'Executive Operator' },
        req
      });

      const token = generateToken(userId);
      return res.json({
        id: userId,
        fullName: newAdminData.fullName,
        email: normalizedEmail,
        role: 'admin',
        token,
        addresses: [],
        mobile: '',
        joinedDate: new Date().toISOString()
      });
    }

    if (!userData) {
      await logFirebaseAuthEvent({
        action: 'USER_LOGIN_FAILED',
        event: 'login_failure',
        email: normalizedEmail,
        status: 'failed',
        failureReason: 'Identity dossier not found in Firestore',
        level: 'warn',
        req
      });
      return res.status(401).json({ message: 'Identity not found. Please register a dossier first.' });
    }

    // Check password
    let isMatch = false;
    if (userData.passwordHash) {
      isMatch = await bcrypt.compare(password, userData.passwordHash);
    } else {
      // If user was created without password hash (or admin setup), update hash on first successful login
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      await updateDoc(doc(db, 'users', userId), { passwordHash: newHash });
      isMatch = true;
    }

    if (!isMatch) {
      await logFirebaseAuthEvent({
        action: 'USER_LOGIN_FAILED',
        event: 'login_failure',
        email: normalizedEmail,
        userId,
        role: userData.role || 'user',
        status: 'failed',
        failureReason: 'Invalid passkey credential',
        level: 'warn',
        req
      });
      return res.status(401).json({ message: 'Invalid passkey. Access denied.' });
    }

    // Record login metadata in Firestore
    try {
      await updateDoc(doc(db, 'users', userId), { 
        lastLoginAt: serverTimestamp(),
        lastLoginIp: ip,
        loginCount: (userData.loginCount || 0) + 1
      });
    } catch (e) {}

    const isSystemAdmin = ADMIN_EMAILS.includes(normalizedEmail) || userData.role === 'admin';
    const effectiveRole = isSystemAdmin ? 'admin' : (userData.role || 'user');

    await logFirebaseAuthEvent({
      action: 'USER_LOGIN_SUCCESS',
      event: 'login_success',
      email: normalizedEmail,
      userId,
      role: effectiveRole,
      provider: userData.authProvider || 'email',
      status: 'success',
      message: `User authenticated successfully: ${normalizedEmail} [${effectiveRole.toUpperCase()}]`,
      details: {
        fullName: userData.fullName || 'User',
        email: normalizedEmail,
        uid: userId,
        role: effectiveRole
      },
      req
    });

    const token = generateToken(userId);
    res.json({
      id: userId,
      fullName: userData.fullName || 'Client Operative',
      email: normalizedEmail,
      role: effectiveRole,
      token,
      addresses: userData.addresses || [],
      address: userData.address || (userData.addresses && userData.addresses[0]) || null,
      mobile: userData.mobile || '',
      alternateMobile: userData.alternateMobile || '',
      joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
export const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, mobile } = req.body;
    const { ip } = getClientMeta(req);

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      await logFirebaseAuthEvent({
        action: 'USER_REGISTRATION_FAILED',
        event: 'signup_failure',
        email: normalizedEmail,
        status: 'failed',
        failureReason: 'Email address already registered',
        level: 'warn',
        req
      });
      return res.status(400).json({ message: 'Dossier already exists for this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isSystemAdmin = ADMIN_EMAILS.includes(normalizedEmail);
    const role = isSystemAdmin ? 'admin' : 'user';
    const userId = (isSystemAdmin ? 'admin_' : 'usr_') + crypto.randomBytes(8).toString('hex');

    const newUser = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: mobile ? mobile.trim() : '',
      role,
      passwordHash,
      authProvider: 'email',
      addresses: [],
      status: 'active',
      lastLoginIp: ip,
      loginCount: 1,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userId), newUser);

    await logFirebaseAuthEvent({
      action: 'USER_REGISTERED',
      event: 'signup',
      email: normalizedEmail,
      userId,
      role,
      provider: 'email',
      status: 'success',
      message: `New client identity registered in Firebase: ${normalizedEmail} (${fullName.trim()})`,
      details: {
        fullName: newUser.fullName,
        email: normalizedEmail,
        uid: userId,
        role
      },
      req
    });

    const token = generateToken(userId);

    res.status(201).json({
      id: userId,
      fullName: newUser.fullName,
      email: normalizedEmail,
      role,
      token,
      mobile: newUser.mobile,
      addresses: [],
      joinedDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

// @desc    Login/Register with Google
// @route   POST /api/auth/google
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, uid } = req.body;
    const { ip } = getClientMeta(req);

    if (!email) {
      return res.status(400).json({ message: 'Email required for Google authentication' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    const isSystemAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      const token = generateToken(userId);

      try {
        await updateDoc(doc(db, 'users', userId), {
          lastLoginAt: serverTimestamp(),
          lastLoginIp: ip,
          loginCount: (userData.loginCount || 0) + 1
        });
      } catch (e) {}

      await logFirebaseAuthEvent({
        action: 'GOOGLE_LOGIN_SUCCESS',
        event: 'login_success',
        email: normalizedEmail,
        userId,
        role: isSystemAdmin ? 'admin' : (userData.role || 'user'),
        provider: 'google',
        status: 'success',
        message: `Google Authentication verified: ${normalizedEmail}`,
        details: { email: normalizedEmail, uid: userId },
        req
      });

      return res.json({
        id: userId,
        fullName: userData.fullName || name || 'User',
        email: normalizedEmail,
        role: isSystemAdmin ? 'admin' : (userData.role || 'user'),
        token,
        addresses: userData.addresses || [],
        mobile: userData.mobile || '',
        joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
      });
    }

    // Create new Google user
    const userId = uid || ('g_' + crypto.randomBytes(8).toString('hex'));
    const role = isSystemAdmin ? 'admin' : 'user';

    const newUser = {
      fullName: name || 'Valued Client',
      email: normalizedEmail,
      mobile: '',
      role,
      authProvider: 'google',
      addresses: [],
      status: 'active',
      lastLoginIp: ip,
      loginCount: 1,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userId), newUser);

    await logFirebaseAuthEvent({
      action: 'GOOGLE_SIGNUP_SUCCESS',
      event: 'signup',
      email: normalizedEmail,
      userId,
      role,
      provider: 'google',
      status: 'success',
      message: `New client dossier registered via Google Auth: ${normalizedEmail}`,
      details: { email: normalizedEmail, fullName: newUser.fullName },
      req
    });

    const token = generateToken(userId);

    res.status(201).json({
      id: userId,
      fullName: newUser.fullName,
      email: normalizedEmail,
      role,
      token,
      mobile: '',
      addresses: [],
      joinedDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Session expired or token invalid' });
    }

    const userDoc = await getDoc(doc(db, 'users', decoded.id));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    const isSystemAdmin = ADMIN_EMAILS.includes(userData.email?.toLowerCase()) || userData.role === 'admin';

    res.json({
      id: userDoc.id,
      fullName: userData.fullName || 'Client Operative',
      email: userData.email,
      role: isSystemAdmin ? 'admin' : (userData.role || 'user'),
      mobile: userData.mobile || '',
      alternateMobile: userData.alternateMobile || '',
      addresses: userData.addresses || [],
      address: userData.address || (userData.addresses && userData.addresses[0]) || null,
      joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { fullName, mobile, addresses, address } = req.body;
    const updatePayload = {};

    if (fullName !== undefined) updatePayload.fullName = fullName;
    if (mobile !== undefined) updatePayload.mobile = mobile;
    if (addresses !== undefined) updatePayload.addresses = addresses;
    if (address !== undefined) updatePayload.address = address;
    updatePayload.updatedAt = serverTimestamp();

    await updateDoc(doc(db, 'users', decoded.id), updatePayload);

    const updatedSnap = await getDoc(doc(db, 'users', decoded.id));
    const data = updatedSnap.data();

    await logFirebaseAuthEvent({
      action: 'USER_PROFILE_UPDATED',
      event: 'profile_update',
      email: data.email,
      userId: decoded.id,
      role: data.role || 'user',
      status: 'success',
      message: `User dossier profile updated on Firebase: ${data.email}`,
      details: { updatedFields: Object.keys(updatePayload) },
      req
    });

    res.json({
      id: decoded.id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      mobile: data.mobile,
      addresses: data.addresses || [],
      address: data.address || (data.addresses && data.addresses[0]) || null
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password / Reset
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      await logFirebaseAuthEvent({
        action: 'PASSWORD_RESET_FAILED',
        event: 'password_reset_request',
        email: normalizedEmail,
        status: 'failed',
        failureReason: 'No dossier registered with this email',
        level: 'warn',
        req
      });
      return res.status(404).json({ message: 'No dossier registered under this email.' });
    }

    const userId = snap.docs[0].id;
    await logFirebaseAuthEvent({
      action: 'PASSWORD_RESET_REQUESTED',
      event: 'password_reset_request',
      email: normalizedEmail,
      userId,
      status: 'success',
      message: `Passcode recovery instructions requested for ${normalizedEmail}`,
      details: { email: normalizedEmail, userId },
      req
    });

    res.json({ 
      success: true, 
      message: 'Passcode recovery instructions initiated. Please contact your concierge or verify your inbox.' 
    });

  } catch (error) {
    next(error);
  }
};
