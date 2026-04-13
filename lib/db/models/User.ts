import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Role, SubscriptionTier } from '@/lib/utils/constants';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  gender: 'm' | 'f';
  country: string;
  role: Role;
  boardOfEducation: string;
  class: string;
  subject: string;
  schoolId: mongoose.Types.ObjectId | null;
  classId: mongoose.Types.ObjectId | null;
  adaptiveLearningEnabled: boolean;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['m', 'f'], required: true },
    country: { type: String, required: true },
    role: {
      type: String,
      enum: ['individual_student', 'school_student', 'teacher', 'management', 'admin'],
      required: true,
    },
    boardOfEducation: { type: String, default: 'CBSE' },
    class: { type: String, default: 'XII' },
    subject: { type: String, default: 'Maths' },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', default: null },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', default: null },
    adaptiveLearningEnabled: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpiry: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    subscriptionTier: { type: String, enum: ['free_trial', 'level_1'], default: 'free_trial' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ schoolId: 1, role: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
export default User;
