
import mongoose from 'mongoose';

const systemSettingsSchema = mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_config' },
  conciergeConfig: {
    instagramHandle: { type: String, default: 'deuzandco' },
    whatsappNumber: { type: String, default: '919876543210' },
    emailAddress: { type: String, default: 'concierge@deuzandco.com' },
    businessHours: { type: String, default: '9 AM - 9 PM IST' },
    dmTemplate: { type: String, default: 'Greetings from DEUZ & CO.' }
  },
  siteContent: {
    heroTitle: { type: String, default: 'CINEMATIC REALITY' },
    heroSubtitle: { type: String, default: 'Crafting immersive visual experiences.' },
    ctaText: { type: String, default: 'Initiate Request' },
    checkoutDisclaimer: { type: String, default: 'Submit your allocation request.' },
    footerText: { type: String, default: 'Designed in Cinematic Vision' }
  }
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
