import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    ipAddress: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ userId: 1, action: 1 });
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
