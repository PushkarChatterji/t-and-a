import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  edu_board: string;
  year: string;
  subject: string;
  chapter_name: string;
  section: string;
  section_name: string;
  question_number: number;
  question: string;
  diagram: string;
  answer_options: Record<string, string>;
  correct_answer_option: string;
  solution_explanation: string;
  difficulty_level: string;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    edu_board: { type: String, required: true },
    year: { type: String, required: true },
    subject: { type: String, required: true },
    chapter_name: { type: String, required: true },
    section: { type: String, required: true },
    section_name: { type: String, required: true },
    question_number: { type: Number, required: true },
    question: { type: String, required: true },
    diagram: { type: String, default: '' },
    answer_options: { type: Map, of: String, required: true },
    correct_answer_option: { type: String, required: true },
    solution_explanation: { type: String, required: true },
    difficulty_level: { type: String, enum: ['Focus', 'Practice', 'Challenge'], required: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ edu_board: 1, year: 1, subject: 1, chapter_name: 1 });
QuestionSchema.index({ edu_board: 1, year: 1, chapter_name: 1, difficulty_level: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question ?? mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
