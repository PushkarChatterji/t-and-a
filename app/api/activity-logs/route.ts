import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import ActivityLog from '@/lib/db/models/ActivityLog';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '30', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (searchParams.get('userId')) filter.userId = searchParams.get('userId');
    if (searchParams.get('action')) filter.action = searchParams.get('action');
    if (searchParams.get('from') || searchParams.get('to')) {
      const dateFilter: Record<string, Date> = {};
      if (searchParams.get('from')) dateFilter.$gte = new Date(searchParams.get('from')!);
      if (searchParams.get('to')) dateFilter.$lte = new Date(searchParams.get('to')!);
      filter.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    // Attach user email/name for display
    const userIds = [...new Set(logs.map(l => String(l.userId)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id email firstName lastName')
      .lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const enriched = logs.map(l => ({
      ...l,
      user: userMap[String(l.userId)] ?? null,
    }));

    return ok({ logs: enriched, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/activity-logs]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
