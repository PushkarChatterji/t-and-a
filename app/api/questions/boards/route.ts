import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { ok, serverError } from '@/lib/utils/api-response';

export const revalidate = 3600;

export async function GET() {
  try {
    await connectDB();
    const boards = await Question.distinct('edu_board');
    return ok(boards.filter(Boolean).sort());
  } catch (err) {
    console.error('[GET /api/questions/boards]', err);
    return serverError();
  }
}
