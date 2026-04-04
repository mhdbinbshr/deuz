import User from '../models/User.js';
import mongoose from 'mongoose';

export const seedAdmin = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
        console.log('[System] MongoDB not connected, skipping admin seed.');
        return;
    }

    // Default credentials for easier initial access
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@deuz.co';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if any admin exists to avoid re-seeding or conflicts
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      console.log('[System] No admin detected. Seeding initial admin account...');
      
      await User.create({
        fullName: 'System Admin',
        email: adminEmail,
        password: password,
        role: 'admin',
        mobile: '0000000000'
      });
      
      console.log(`[System] Admin seeded successfully.`);
      console.log(`[System] Login: ${adminEmail}`);
      console.log(`[System] Password: ${password}`);
    } else {
        console.log(`[System] Admin verification passed. Database is secured.`);
        // If you need to reset, manually delete the user in MongoDB or change the email in .env
    }
  } catch (error) {
    console.error('[System] Admin seeding interrupted:', error.message);
  }
};