import axios from 'axios';

/**
 * Sends a notification via Instagram Graph API.
 * NOTE: This requires a verified Meta Business App, a System User, and a long-lived Page Access Token.
 * For this implementation, we simulate the logic and log the action if tokens are missing.
 */
export const sendInstagramNotification = async (orderCode, customerName, city, totalAmount, itemsCount, contactMethod) => {
    const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
    const IG_BUSINESS_ACCOUNT_ID = process.env.IG_BUSINESS_ACCOUNT_ID;
    
    // Structured Message for Admin Inbox (Machine Readable)
    const message = 
`🚨 NEW ACQUISITION REQUEST

[ORDER_CODE] ${orderCode}
[CHANNEL] ${contactMethod}
[VALUE] ${totalAmount}
[ITEMS] ${itemsCount}

Client: ${customerName}
Region: ${city}
Status: Awaiting Curator`;

    if (!IG_ACCESS_TOKEN || !IG_BUSINESS_ACCOUNT_ID) {
        console.log(`\n[BACKEND-TRIGGERED NOTIFICATION] -----------------------`);
        console.log(message);
        console.log(`----------------------------------------------------------\n`);
        return { success: true, mocked: true };
    }

    try {
        // This endpoint sends a message. 
        // Note: You cannot message yourself (the page) via API easily without a user-initiated thread.
        // This logic assumes we are messaging a specific admin user ID defined in env.
        const ADMIN_RECIPIENT_ID = process.env.IG_ADMIN_RECIPIENT_ID;

        if (ADMIN_RECIPIENT_ID) {
            await axios.post(`https://graph.facebook.com/v18.0/${IG_BUSINESS_ACCOUNT_ID}/messages`, {
                recipient: { id: ADMIN_RECIPIENT_ID },
                message: { text: message }
            }, {
                headers: { Authorization: `Bearer ${IG_ACCESS_TOKEN}` }
            });
            console.log(`[IG API] Notification sent for ${orderCode}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error('[IG API Error]', error?.response?.data || error.message);
        // Don't fail the order if notification fails
        return { success: false };
    }
};