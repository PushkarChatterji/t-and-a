import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SubscriptionTier } from '@/lib/utils/constants';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date | null;
  paymentId: string | null;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tier: { type: String, enum: ['free_trial', 'level_1'], required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    paymentId: { type: String, default: null },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ??
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
