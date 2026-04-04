
import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  method: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  referenceId: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: { type: String }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
