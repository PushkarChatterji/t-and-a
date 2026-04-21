import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { ok, serverError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const board = new URL(req.url).searchParams.get('board') ?? '';
    const filter = board ? { edu_board: board } : {};
    const years = await Question.distinct('year', filter);
    return ok(years.filter(Boolean).sort());
  } catch (err) {
    console.error('[GET /api/questions/years]', err);
    return serverError();
  }
}
