import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, created, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';
import bcrypt from 'bcryptjs';

// GET /api/users — list users (admin only)
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (searchParams.get('role')) filter.role = searchParams.get('role');
    if (searchParams.get('schoolId')) filter.schoolId = searchParams.get('schoolId');
    if (searchParams.get('search')) {
      const s = searchParams.get('search')!;
      filter.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return ok({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/users]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

// POST /api/users — create user (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const body = await req.json();

    const { email, password, firstName, lastName, gender, country, role, schoolId, boardOfEducation, class: userClass } = body;

    if (!email || !password || !firstName || !lastName || !gender || !country || !role) {
      return badRequest('Missing required fields');
    }
    if (!Object.values(ROLES).includes(role)) {
      return badRequest('Invalid role');
    }
    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return badRequest('Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      gender,
      country,
      role,
      schoolId: schoolId || null,
      boardOfEducation: boardOfEducation || 'CBSE',
      class: userClass || 'XII',
      emailVerified: true, // Admin-created users skip email verification
    });

    const { passwordHash: _ph, ...safeUser } = user.toObject();
    return created({ user: safeUser });
  } catch (err) {
    console.error('[POST /api/users]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
