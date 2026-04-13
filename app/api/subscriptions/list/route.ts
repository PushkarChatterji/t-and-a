import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Subscription from '@/lib/db/models/Subscription';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (searchParams.get('tier')) filter.tier = searchParams.get('tier');
    if (searchParams.get('status')) filter.status = searchParams.get('status');

    const [subs, total] = await Promise.all([
      Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscription.countDocuments(filter),
    ]);

    const userIds = [...new Set(subs.map(s => String(s.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id email firstName lastName').lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const enriched = subs.map(s => ({ ...s, user: userMap[String(s.userId)] ?? null }));

    return ok({ subscriptions: enriched, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/subscriptions/list]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
