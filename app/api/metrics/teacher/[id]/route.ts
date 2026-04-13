import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import QuestionList from '@/lib/db/models/QuestionList';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/metrics/teacher/[id]
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const teacher = await User.findById(id).select('firstName lastName email schoolId').lean();
    if (!teacher) return notFound('Teacher not found');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [loginCount30d, loginCount7d, listsCreated, listsAssigned, recentLogs] = await Promise.all([
      ActivityLog.countDocuments({ userId: id, action: 'login', createdAt: { $gte: thirtyDaysAgo } }),
      ActivityLog.countDocuments({ userId: id, action: 'login', createdAt: { $gte: sevenDaysAgo } }),
      QuestionList.countDocuments({ createdBy: id }),
      QuestionList.countDocuments({ createdBy: id, 'assignments.0': { $exists: true } }),
      ActivityLog.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return ok({
      teacher,
      loginCount30d,
      loginCount7d,
      listsCreated,
      listsAssigned,
      recentActivity: recentLogs,
    });
  } catch (err) {
    console.error('[GET /api/metrics/teacher/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT]);
