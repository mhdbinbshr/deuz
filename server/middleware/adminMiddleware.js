export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Restricted: Tier 1 Clearance Required' });
  }
};

export const conciergeOnly = (req, res, next) => {
  // Admins inherently have concierge access
  if (req.user && (req.user.role === 'concierge' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Restricted: Staff Access Only' });
  }
};