import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Question from '@/lib/db/models/Question';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES, QUESTION_STATUS } from '@/lib/utils/constants';

// GET /api/student-progress?topic=&status=&questionListId=
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.sub),
    };
    if (searchParams.get('questionListId')) {
      filter.questionListId = new mongoose.Types.ObjectId(searchParams.get('questionListId')!);
    }
    if (searchParams.get('status')) {
      filter.status = searchParams.get('status');
    }

    // If filtering by topic (chapter_name), look up matching question IDs first
    const topic = searchParams.get('topic');
    if (topic) {
      const questionIds = await Question.find({ chapter_name: topic }).distinct('_id');
      filter.questionId = { $in: questionIds };
    }

    const records = await StudentProgress.find(filter).lean();
    return ok({ progress: records });
  } catch (err) {
    console.error('[GET /api/student-progress]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT, ROLES.SCHOOL_STUDENT]);

// POST /api/student-progress  { questionId, status, questionListId? }
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const body = await req.json();
    const { questionId, status, questionListId } = body;

    if (!questionId || !status) return badRequest('questionId and status are required');
    const validStatuses = Object.values(QUESTION_STATUS);
    if (!validStatuses.includes(status)) return badRequest(`status must be one of: ${validStatuses.join(', ')}`);

    const record = await StudentProgress.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(user.sub),
        questionId: new mongoose.Types.ObjectId(questionId),
      },
      {
        $set: {
          status,
          lastAttemptAt: new Date(),
          ...(questionListId ? { questionListId: new mongoose.Types.ObjectId(questionListId) } : {}),
        },
        $inc: { attemptCount: 1 },
      },
      { upsert: true, new: true }
    );

    return ok({ progress: record });
  } catch (err) {
    console.error('[POST /api/student-progress]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT, ROLES.SCHOOL_STUDENT]);
