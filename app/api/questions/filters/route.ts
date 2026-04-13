import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

/**
 * GET /api/questions/filters
 *
 * Returns distinct dropdown values scoped to the supplied filters.
 * Query params (all optional):
 *   board  – filter by edu_board
 *   year   – filter by year
 *
 * boards and years are always returned unscoped (so dropdowns never
 * empty themselves when the user changes a parent selection).
 * chapters and difficulties are scoped to board + year.
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const board = searchParams.get('board') ?? '';
    const year  = searchParams.get('year')  ?? '';

    const scoped: Record<string, unknown> = {};
    if (board) scoped.edu_board = board;
    if (year)  scoped.year = year;

    const [
      boards,
      years,
      chapters,
      difficulties,
    ] = await Promise.all([
      Question.distinct('edu_board'),
      Question.distinct('year'),
      Question.distinct('chapter_name', scoped),
      Question.distinct('difficulty_level', scoped),
    ]);

    const sort = (arr: string[]) => arr.filter(Boolean).sort();

    return ok({
      boards:       sort(boards),
      years:        sort(years),
      chapters:     sort(chapters),
      difficulties: sort(difficulties),
    });
  } catch (err) {
    console.error('[GET /api/questions/filters]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
