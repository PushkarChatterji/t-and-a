import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import QuestionList from '@/lib/db/models/QuestionList';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

// GET /api/question-lists/assigned — lists assigned to the current student (by class or directly)
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;

    // Get the student's classId from DB
    const student = await User.findById(user.sub).select('classId').lean();
    const classId = student?.classId;

    // Find lists assigned to this student or their class
    const orConditions: Record<string, unknown>[] = [
      { 'assignments.targetType': 'student', 'assignments.targetId': user.sub },
    ];
    if (classId) {
      orConditions.push({ 'assignments.targetType': 'class', 'assignments.targetId': classId });
    }

    const lists = await QuestionList.find({ $or: orConditions })
      .sort({ updatedAt: -1 })
      .lean();

    return ok({ lists, total: lists.length });
  } catch (err) {
    console.error('[GET /api/question-lists/assigned]', err);
    return serverError();
  }
}, [ROLES.SCHOOL_STUDENT, ROLES.INDIVIDUAL_STUDENT]);
