import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import School from '@/lib/db/models/School';
import Question from '@/lib/db/models/Question';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

export const GET = withAuth(async (_req: NextRequest) => {
  try {
    await connectDB();

    const [
      totalUsers,
      totalStudents,
      totalSchools,
      totalQuestions,
      recentLogins,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: { $in: ['individual_student', 'school_student'] } }),
      School.countDocuments({ isActive: true }),
      Question.countDocuments(),
      ActivityLog.countDocuments({
        action: 'login',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return ok({ totalUsers, totalStudents, totalSchools, totalQuestions, recentLogins });
  } catch (err) {
    console.error('[GET /api/metrics/summary]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
