/**
 * DEUZ & CO Strict Order Lifecycle
 * Enforces the progression through the 4 phases
 */

const ALLOWED_TRANSITIONS = {
    // PHASE 1
    ORDER_SECURED: ['PAYMENT_AUTHORIZED', 'CANCELLED'],
    PAYMENT_AUTHORIZED: ['ORDER_VERIFIED', 'CANCELLED'],
    ORDER_VERIFIED: ['IN_PRODUCTION', 'CANCELLED'],
    
    // PHASE 2
    IN_PRODUCTION: ['QUALITY_ASSURED', 'CANCELLED'],
    QUALITY_ASSURED: ['READY_FOR_DISPATCH', 'CANCELLED'],
    READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],

    // PHASE 3
    DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['ARRIVED_AT_HUB', 'CANCELLED'],
    ARRIVED_AT_HUB: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],

    // PHASE 4
    DELIVERED: ['EXPERIENCE_UNLOCKED', 'CANCELLED'],
    EXPERIENCE_UNLOCKED: ['CANCELLED'],

    // Terminal State
    CANCELLED: []
};

/**
 * Validates if a transition is legal.
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @returns {boolean}
 */
export const canTransition = (currentStatus, nextStatus) => {
    // Idempotency: Allow staying in same state (e.g. updating details)
    if (currentStatus === nextStatus) return true;
    
    // Admin Override for Cancellations: Can cancel almost anytime
    if (nextStatus === 'CANCELLED') {
        return true; 
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
};

/**
 * Helper to update order status with audit trail.
 * @param {Object} order Mongoose document
 * @param {string} nextStatus Target status
 * @param {string} changedBy ID of user/admin or 'System'
 * @param {string} note Optional note
 * @throws {Error} if transition is invalid
 */
export const transitionOrder = async (order, nextStatus, changedBy = 'System', note = '') => {
    if (!order) throw new Error('Order not provided');

    if (!canTransition(order.orderStatus, nextStatus)) {
        throw new Error(`Invalid state transition: Cannot move from ${order.orderStatus} to ${nextStatus}`);
    }

    // Apply Status
    order.orderStatus = nextStatus;

    // Record History (Audit Log)
    order.statusHistory.push({
        status: nextStatus,
        timestamp: new Date(),
        changedBy,
        note
    });

    return order;
};