import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';
import { getNextAdaptiveQuestion } from '@/lib/adaptive/engine';

// GET /api/student-progress/adaptive?topic=
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const jwtUser = getRequestUser(req)!;
    const { searchParams } = new URL(req.url);

    const chapter = searchParams.get('topic');
    if (!chapter) return badRequest('topic is required');

    // Look up the student's own board and class from the DB — never trust client params
    const dbUser = await User.findById(jwtUser.sub).select('boardOfEducation class subject').lean();

    const result = await getNextAdaptiveQuestion({
      userId: jwtUser.sub,
      chapter,
      board: dbUser?.boardOfEducation ?? undefined,
      year: dbUser?.class ?? undefined,
      subject: dbUser?.subject ?? undefined,
    });

    if (result.reason === 'exhausted' || !result.question) {
      return ok({ question: null, reason: 'exhausted', difficulty: result.difficulty });
    }

    return ok({ question: result.question, reason: result.reason, difficulty: result.difficulty });
  } catch (err) {
    console.error('[GET /api/student-progress/adaptive]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT, ROLES.SCHOOL_STUDENT]);
