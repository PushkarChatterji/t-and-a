import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Class from '@/lib/db/models/Class';
import User from '@/lib/db/models/User';
import StudentProgress from '@/lib/db/models/StudentProgress';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/metrics/class/[id] — class metrics for management/admin
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const cls = await Class.findById(id).lean();
    if (!cls) return notFound('Class not found');

    // Get students in this class
    const students = await User.find({ classId: id, role: ROLES.SCHOOL_STUDENT })
      .select('_id firstName lastName email')
      .lean();

    const studentIds = students.map(s => s._id);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count recent logins per student
    const recentLogins = await ActivityLog.aggregate([
      {
        $match: {
          userId: { $in: studentIds },
          action: 'login',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const loginMap = new Map(recentLogins.map((r: { _id: string; count: number }) => [String(r._id), r.count]));

    // Progress stats per student
    const progressAgg = await StudentProgress.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: '$userId',
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          need_help: { $sum: { $cond: [{ $eq: ['$status', 'need_help'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);
    const progressMap = new Map(progressAgg.map((r: { _id: string; done: number; need_help: number; total: number }) => [String(r._id), r]));

    const studentStats = students.map(s => {
      const sid = String(s._id);
      const prog = progressMap.get(sid) as { done: number; need_help: number; total: number } | undefined;
      return {
        _id: sid,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        loginsLast7Days: loginMap.get(sid) ?? 0,
        done: prog?.done ?? 0,
        need_help: prog?.need_help ?? 0,
        totalAttempted: prog?.total ?? 0,
      };
    });

    // Histogram: distribution of "done" counts
    const doneCounts = studentStats.map(s => s.done);
    const maxDone = Math.max(...doneCounts, 0);
    const bucketSize = maxDone > 0 ? Math.ceil(maxDone / 5) : 1;
    const histogram: { range: string; count: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const lo = i * bucketSize;
      const hi = (i + 1) * bucketSize - 1;
      histogram.push({
        range: `${lo}-${hi}`,
        count: doneCounts.filter(d => d >= lo && d <= hi).length,
      });
    }

    return ok({
      class: cls,
      totalStudents: students.length,
      loggedInLast7Days: recentLogins.length,
      studentStats,
      histogram,
    });
  } catch (err) {
    console.error('[GET /api/metrics/class/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);
