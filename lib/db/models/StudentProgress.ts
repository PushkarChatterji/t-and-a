import mongoose, { Schema, Document, Model } from 'mongoose';
import type { QuestionStatus } from '@/lib/utils/constants';

export interface IStudentProgress extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  status: QuestionStatus;
  attemptCount: number;
  lastAttemptAt: Date | null;
  questionListId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProgressSchema = new Schema<IStudentProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    status: {
      type: String,
      enum: ['done', 'need_help', 'unattempted'],
      default: 'unattempted',
    },
    attemptCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    questionListId: { type: Schema.Types.ObjectId, ref: 'QuestionList', default: null },
  },
  { timestamps: true }
);

StudentProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
StudentProgressSchema.index({ userId: 1, status: 1 });
StudentProgressSchema.index({ userId: 1, questionListId: 1 });

const StudentProgress: Model<IStudentProgress> =
  mongoose.models.StudentProgress ??
  mongoose.model<IStudentProgress>('StudentProgress', StudentProgressSchema);
export default StudentProgress;
