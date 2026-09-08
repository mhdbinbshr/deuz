export const CONCIERGE_CONFIG = {
  whatsappNumber: '918848918633', // Official WhatsApp concierge
  instagramHandle: 'deuzandco', // Official Instagram handle
  emailAddress: 'deuzandco@gmail.com'
};

/**
 * Generates a unique purchase code strictly in the format DEUZ-TIME-DDMMYY
 * Example: DEUZ-143025-070926
 */
export const generatePurchaseCode = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const time = `${hh}${mm}${ss}`;
  
  const dd = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const ddmmyy = `${dd}${month}${yy}`;
  
  return `DEUZ-${time}-${ddmmyy}`;
};

export const generateConciergeMessage = (orderCode: string, total: number, items: any[], address: any) => {
  const itemsList = items.map((i, idx) => {
    const houseCodeTag = i.houseCode ? ` [House Code: ${i.houseCode}]` : '';
    const sizeTag = i.selectedSize ? ` (Size: ${i.selectedSize})` : '';
    const qtyTag = i.quantity > 1 ? ` x${i.quantity}` : '';
    return `  • Artifact ${idx + 1}: ${i.title}${houseCodeTag}${sizeTag}${qtyTag} — ₹${(i.price * (i.quantity || 1)).toLocaleString('en-IN')}`;
  }).join('\n');
  
  const houseCodes = Array.from(new Set(items.map(i => i.houseCode).filter(Boolean))).join(', ') || 'STUDIO ARCHIVE';
  const fullName = address?.fullName || `${address?.firstName || ''} ${address?.lastName || ''}`.trim() || 'Valued Client';
  const fullAddress = address?.address || `${address?.house || ''} ${address?.street || ''}`.trim();
  const cityStateZip = `${address?.city || ''}, ${address?.state || ''} ${address?.pincode ? `— ${address.pincode}` : ''}`.trim();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return `
=========================================
          DEUZ & CO. ATELIER
      ACQUISITION & PAYMENT DOSSIER
=========================================
UNIQUE PURCHASE CODE : ${orderCode}
HOUSE CODE(S)        : ${houseCodes}
DATE & TIME          : ${dateStr} at ${timeStr}
-----------------------------------------
ACQUISITION SUMMARY:
${itemsList}

SUBTOTAL             : ₹${total.toLocaleString('en-IN')}
INSURED FREIGHT      : COMPLIMENTARY (PAN-INDIA)
GRAND TOTAL DUE      : ₹${total.toLocaleString('en-IN')}
-----------------------------------------
INSURED SHIPPING REGISTRY:
  Recipient : ${fullName}
  Address   : ${fullAddress}
  City/State: ${cityStateZip}
  Contact   : ${address?.mobile || 'Confidential'}
  Email     : ${address?.email || 'Confidential'}
  Country   : India
=========================================
"Not for everyone."
Kindly verify this dossier to authorize private concierge payment.
`.trim();
};

export const getContactUrl = (method: string, message: string, orderCode: string) => {
  const encodedMessage = encodeURIComponent(message);
  switch (method) {
    case 'whatsapp':
      return `https://wa.me/${CONCIERGE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
    case 'instagram':
      // Direct Instagram URL - users can paste the copied dossier into the DM
      return `https://ig.me/m/${CONCIERGE_CONFIG.instagramHandle}`;
    case 'email':
    case 'gmail':
      // Web Gmail compose URL first, with mailto fallback handled by browser
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${CONCIERGE_CONFIG.emailAddress}&su=${encodeURIComponent(`DEUZ Purchase Order Dossier [${orderCode}]`)}&body=${encodedMessage}`;
    default:
      return null;
  }
};

export const getMailtoUrl = (message: string, orderCode: string) => {
  return `mailto:${CONCIERGE_CONFIG.emailAddress}?subject=${encodeURIComponent(`DEUZ Purchase Order Dossier [${orderCode}]`)}&body=${encodeURIComponent(message)}`;
};

export const getInteractionDetails = () => {
    return {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        platform: navigator.platform,
        language: navigator.language
    };
};

