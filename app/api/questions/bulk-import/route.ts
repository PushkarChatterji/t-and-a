import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { withAuth } from '@/lib/auth/middleware';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

interface RawQuestion {
  edu_board?: string;
  year?: string;
  subject?: string;
  chapter_name?: string;
  section?: string;
  section_name?: string;
  question_number?: number;
  question?: string;
  diagram?: string;
  answer_options?: Record<string, string>;
  correct_answer_option?: string;
  solution_explanation?: string;
  difficulty_level?: string;
}

const VALID_DIFFICULTIES = ['Focus', 'Practice', 'Challenge'];

export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!Array.isArray(body.questions)) return badRequest('Expected { questions: [...] }');
    const raw: RawQuestion[] = body.questions;
    if (raw.length === 0) return badRequest('No questions provided');
    if (raw.length > 5000) return badRequest('Maximum 5000 questions per import');

    const results = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < raw.length; i++) {
      const q = raw[i];

      if (!q.edu_board || !q.year || !q.chapter_name || !q.question || !q.solution_explanation || !q.difficulty_level) {
        results.errors.push(`Row ${i + 1}: missing required fields (edu_board, year, chapter_name, question, solution_explanation, difficulty_level)`);
        results.skipped++;
        continue;
      }
      if (!VALID_DIFFICULTIES.includes(q.difficulty_level)) {
        results.errors.push(`Row ${i + 1}: invalid difficulty_level "${q.difficulty_level}" — must be Focus, Practice, or Challenge`);
        results.skipped++;
        continue;
      }

      try {
        const existing = await Question.findOne({
          edu_board: q.edu_board,
          year: q.year,
          chapter_name: q.chapter_name,
          question_number: q.question_number,
        });

        const doc = {
          edu_board: q.edu_board,
          year: q.year,
          subject: q.subject ?? 'Maths',
          chapter_name: q.chapter_name,
          section: q.section ?? '',
          section_name: q.section_name ?? '',
          question_number: q.question_number ?? 0,
          question: q.question,
          diagram: q.diagram ?? '',
          answer_options: q.answer_options ?? {},
          correct_answer_option: q.correct_answer_option ?? '',
          solution_explanation: q.solution_explanation,
          difficulty_level: q.difficulty_level,
        };

        if (existing) {
          await Question.updateOne({ _id: existing._id }, { $set: { ...doc, updatedAt: new Date() } });
          results.updated++;
        } else {
          await Question.create(doc);
          results.inserted++;
        }
      } catch {
        results.errors.push(`Row ${i + 1}: failed to upsert`);
        results.skipped++;
      }
    }

    return ok({ results });
  } catch (err) {
    console.error('[POST /api/questions/bulk-import]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
