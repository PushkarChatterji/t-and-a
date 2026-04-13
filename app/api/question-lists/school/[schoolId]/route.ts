import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import QuestionList from '@/lib/db/models/QuestionList';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/question-lists/school/[schoolId] — all published lists for a school (for adopt)
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { schoolId } = await ctx.params;

    const lists = await QuestionList.find({ schoolId, isPublished: true })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with creator name
    const creatorIds = [...new Set(lists.map(l => String(l.createdBy)))];
    const creators = await User.find({ _id: { $in: creatorIds } })
      .select('firstName lastName email')
      .lean();
    const creatorMap = new Map(creators.map(c => [String(c._id), c]));

    const enriched = lists.map(l => ({
      ...l,
      creatorName: (() => {
        const c = creatorMap.get(String(l.createdBy));
        return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
      })(),
    }));

    return ok({ lists: enriched, total: enriched.length });
  } catch (err) {
    console.error('[GET /api/question-lists/school/[schoolId]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.TEACHER, ROLES.MANAGEMENT]);
