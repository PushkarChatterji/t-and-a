import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClass extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  grade: string;
  section: string;
  subject: string;
  academicYear: string;
  teacherIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, default: 'Maths' },
    academicYear: { type: String, required: true },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

ClassSchema.index({ schoolId: 1 });
ClassSchema.index({ teacherIds: 1 });

const Class: Model<IClass> = mongoose.models.Class ?? mongoose.model<IClass>('Class', ClassSchema);
export default Class;
