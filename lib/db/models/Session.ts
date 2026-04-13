import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  lastActivityAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refreshTokenHash: { type: String, required: true },
    ipAddress: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1 });
SessionSchema.index({ refreshTokenHash: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>('Session', SessionSchema);
export default Session;
