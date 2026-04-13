import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  code: string;
  address: { city: string; state: string; country: string };
  boardOfEducation: string;
  contactEmail: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    boardOfEducation: { type: String, default: 'CBSE' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SchoolSchema.index({ code: 1 }, { unique: true });

const School: Model<ISchool> =
  mongoose.models.School ?? mongoose.model<ISchool>('School', SchoolSchema);
export default School;
