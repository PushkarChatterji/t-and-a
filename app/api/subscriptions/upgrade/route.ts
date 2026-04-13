import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import Subscription from '@/lib/db/models/Subscription';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

// POST /api/subscriptions/upgrade — stubbed, immediately upgrades to level_1
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const userId = new mongoose.Types.ObjectId(user.sub);

    // Stub: mark existing subscription as cancelled, create new level_1
    await Subscription.updateMany({ userId, status: 'active' }, { $set: { status: 'cancelled' } });

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await Subscription.create({
      userId,
      tier: 'level_1',
      status: 'active',
      startDate: new Date(),
      endDate,
      paymentId: `STUB_${Date.now()}`,
      amount: 999,
      currency: 'INR',
    });

    await User.findByIdAndUpdate(userId, { subscriptionTier: 'level_1' });

    return ok({ message: 'Upgraded to Level 1 subscription (stubbed)' });
  } catch (err) {
    console.error('[POST /api/subscriptions/upgrade]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT]);
