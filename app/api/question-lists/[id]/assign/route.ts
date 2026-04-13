import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import QuestionList from '@/lib/db/models/QuestionList';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, forbidden, serverError } from '@/lib/utils/api-response';
import { ROLES, ACTIVITY_ACTIONS } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// POST /api/question-lists/[id]/assign
export const POST = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { id } = await ctx.params;
    const body = await req.json();

    const { targetType, targetId, dueDate } = body;
    if (!targetType || !targetId) {
      return badRequest('targetType and targetId are required');
    }
    if (!['class', 'student'].includes(targetType)) {
      return badRequest('targetType must be "class" or "student"');
    }

    const list = await QuestionList.findById(id);
    if (!list) return notFound('Question list not found');

    if (user.role !== ROLES.ADMIN && String(list.createdBy) !== user.sub) {
      return forbidden('You do not have permission to assign this list');
    }

    // Avoid duplicate assignments to same target
    const alreadyAssigned = list.assignments.some(
      a => String(a.targetId) === String(targetId) && a.targetType === targetType
    );
    if (!alreadyAssigned) {
      list.assignments.push({
        targetType,
        targetId,
        assignedAt: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      await list.save();
    }

    // Log activity
    await ActivityLog.create({
      userId: user.sub,
      action: ACTIVITY_ACTIONS.QUESTION_LIST_ASSIGNED,
      metadata: { listId: id, targetType, targetId },
    }).catch(() => {});

    return ok({ list });
  } catch (err) {
    console.error('[POST /api/question-lists/[id]/assign]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.TEACHER]);
