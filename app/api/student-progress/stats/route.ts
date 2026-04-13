import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Question from '@/lib/db/models/Question';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

// GET /api/student-progress/stats?groupBy=topic
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const userId = new mongoose.Types.ObjectId(user.sub);
    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get('groupBy') ?? 'topic';

    if (groupBy === 'topic') {
      // Join progress with questions to group by chapter_name
      const stats = await StudentProgress.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        {
          $group: {
            _id: { topic: '$question.chapter_name', status: '$status' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.topic',
            statusCounts: {
              $push: { status: '$_id.status', count: '$count' },
            },
            total: { $sum: '$count' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Total question counts per chapter
      const chapterTotals = await Question.aggregate([
        { $group: { _id: '$chapter_name', total: { $sum: 1 } } },
      ]);
      const totalByChapter: Record<string, number> = {};
      for (const t of chapterTotals) totalByChapter[t._id] = t.total;

      const result = stats.map(s => {
        const counts: Record<string, number> = {};
        for (const sc of s.statusCounts) counts[sc.status] = sc.count;
        return {
          topic: s._id,
          attempted: s.total,
          totalQuestions: totalByChapter[s._id] ?? 0,
          done: counts.done ?? 0,
          need_help: counts.need_help ?? 0,
        };
      });

      return ok({ stats: result, totalByTopic: totalByChapter });
    }

    // Overall counts
    const overall = await StudentProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const o of overall) counts[o._id] = o.count;
    return ok({ stats: counts });
  } catch (err) {
    console.error('[GET /api/student-progress/stats]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT, ROLES.SCHOOL_STUDENT]);
