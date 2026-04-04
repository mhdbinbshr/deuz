
import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetResource: { type: String },
  targetId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false } // Only createdAt as timestamp
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
