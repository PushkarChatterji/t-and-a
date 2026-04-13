import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import QuestionList from '@/lib/db/models/QuestionList';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, created, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES, ACTIVITY_ACTIONS } from '@/lib/utils/constants';

// GET /api/question-lists?schoolId=&createdBy=&page=&limit=
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Teachers see their own lists; management/admin see all for a school
    if (user.role === ROLES.TEACHER) {
      filter.createdBy = user.sub;
    } else {
      if (searchParams.get('schoolId')) filter.schoolId = searchParams.get('schoolId');
      if (searchParams.get('createdBy')) filter.createdBy = searchParams.get('createdBy');
    }

    const [lists, total] = await Promise.all([
      QuestionList.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      QuestionList.countDocuments(filter),
    ]);

    return ok({ lists, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/question-lists]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);

// POST /api/question-lists — Teacher creates a list
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const body = await req.json();

    const { title, description, schoolId, questionIds, board, class: cls, subject, topic, isPublished } = body;

    if (!title || !schoolId) {
      return badRequest('title and schoolId are required');
    }

    const list = await QuestionList.create({
      title,
      description: description || '',
      schoolId,
      createdBy: user.sub,
      questionIds: questionIds || [],
      assignments: [],
      isPublished: isPublished ?? false,
      board: board || 'CBSE',
      class: cls || 'XII',
      subject: subject || 'Maths',
      topic: topic || undefined,
    });

    // Log activity
    await ActivityLog.create({
      userId: user.sub,
      action: ACTIVITY_ACTIONS.QUESTION_LIST_CREATED,
      metadata: { listId: list._id, title },
    }).catch(() => {});

    return created({ list });
  } catch (err) {
    console.error('[POST /api/question-lists]', err);
    return serverError();
  }
}, [ROLES.TEACHER, ROLES.ADMIN]);
