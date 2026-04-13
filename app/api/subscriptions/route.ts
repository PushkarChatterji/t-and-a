import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import Subscription from '@/lib/db/models/Subscription';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

// GET /api/subscriptions — returns the caller's active subscription
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;

    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(user.sub),
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .lean();

    return ok({ subscription });
  } catch (err) {
    console.error('[GET /api/subscriptions]', err);
    return serverError();
  }
});
