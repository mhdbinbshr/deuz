
import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  conciergeCode: { type: String, required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    quantity: Number,
    price: Number,
    image: String,
    selectedSize: String
  }],
  shippingAddress: {
    firstName: String,
    lastName: String,
    fullName: String, // Legacy
    email: String,
    mobile: String,
    country: { type: String, default: 'India' },
    address: String,
    city: String,
    state: String,
    pincode: String,
    // Legacy fields kept for history
    house: String,
    street: String,
    landmark: String,
    type: { type: String }
  },
  totalAmount: { type: Number, required: true },
  contactMethod: { type: String, required: true },
  paymentStatus: { type: String, default: 'Pending' },
  orderStatus: { 
    type: String, 
    required: true, 
    default: 'ORDER_SECURED' 
  },
  paymentLink: String,
  internalNotes: String,
  conversationStartedAt: Date,
  externalInteractions: [{
    action: String,
    channel: String,
    target: String,
    timestamp: Date
  }],
  statusHistory: [{
    status: String,
    timestamp: Date,
    changedBy: String,
    note: String
  }]
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
