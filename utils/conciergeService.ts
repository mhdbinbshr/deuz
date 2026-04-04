export const CONCIERGE_CONFIG = {
  whatsappNumber: '919876543210', // Replace with actual number
  instagramHandle: 'deuzandco', // Replace with actual handle
  emailAddress: 'deuzandco@gmail.com'
};

export const generateConciergeMessage = (orderCode: string, total: number, items: any[], address: any) => {
  const itemsList = items.map(i => `  • ${i.title} (x${i.quantity}) - ₹${(i.price * i.quantity).toLocaleString('en-IN')}`).join('\n');
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
=========================================
          DEUZ & CO. INVOICE
=========================================
DOSSIER REFERENCE : ${orderCode}
DATE ISSUED       : ${date}
-----------------------------------------
ACQUISITION DETAILS:
${itemsList}

SUBTOTAL          : ₹${total.toLocaleString('en-IN')}
ESTIMATED TOTAL   : ₹${total.toLocaleString('en-IN')}
-----------------------------------------
SHIPPING REGISTRY:
  ${address.fullName}
  ${address.house}, ${address.street}
  ${address.city}, ${address.state} - ${address.pincode}
  Contact: ${address.mobile}
=========================================
"Crafting immersive visual experiences."
Please confirm this dossier to proceed.
`.trim();
};

export const getContactUrl = (method: string, message: string, orderCode: string) => {
  const encodedMessage = encodeURIComponent(message);
  switch (method) {
    case 'whatsapp':
      return `https://wa.me/${CONCIERGE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
    case 'instagram':
      return `https://ig.me/m/${CONCIERGE_CONFIG.instagramHandle}`; // Note: ig.me doesn't support pre-filled text well, but this is standard
    case 'email':
      return `mailto:${CONCIERGE_CONFIG.emailAddress}?subject=Dossier%20${orderCode}&body=${encodedMessage}`;
    default:
      return null;
  }
};

export const getInteractionDetails = () => {
    return {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        platform: navigator.platform,
        language: navigator.language
    };
};
