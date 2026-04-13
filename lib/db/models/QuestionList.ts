import mongoose, { Schema, Document, Model } from 'mongoose';

interface Assignment {
  targetType: 'class' | 'student';
  targetId: mongoose.Types.ObjectId;
  assignedAt: Date;
  dueDate?: Date;
}

export interface IQuestionList extends Document {
  title: string;
  description: string;
  schoolId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  questionIds: mongoose.Types.ObjectId[];
  assignments: Assignment[];
  isPublished: boolean;
  board: string;
  class: string;
  subject: string;
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionListSchema = new Schema<IQuestionList>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    assignments: [
      {
        targetType: { type: String, enum: ['class', 'student'], required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        assignedAt: { type: Date, default: Date.now },
        dueDate: { type: Date },
      },
    ],
    isPublished: { type: Boolean, default: false },
    board: { type: String, default: 'CBSE' },
    class: { type: String, default: 'XII' },
    subject: { type: String, default: 'Maths' },
    topic: { type: String },
  },
  { timestamps: true }
);

QuestionListSchema.index({ schoolId: 1, createdBy: 1 });
QuestionListSchema.index({ 'assignments.targetId': 1 });

const QuestionList: Model<IQuestionList> =
  mongoose.models.QuestionList ??
  mongoose.model<IQuestionList>('QuestionList', QuestionListSchema);
export default QuestionList;
