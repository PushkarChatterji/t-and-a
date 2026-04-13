/**
 * Seeds one dummy account per role for testing.
 * Run: npx tsx scripts/seed-dummy-users.ts
 *
 * All accounts use password: Test1234!
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');
  const subscriptions = db.collection('subscriptions');

  const passwordHash = await bcrypt.hash('Test1234!', 12);

  const accounts = [
    {
      email: 'admin@test.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      gender: 'm',
    },
    {
      email: 'teacher@test.com',
      role: 'teacher',
      firstName: 'Priya',
      lastName: 'Sharma',
      gender: 'f',
    },
    {
      email: 'management@test.com',
      role: 'management',
      firstName: 'Rahul',
      lastName: 'Singh',
      gender: 'm',
    },
    {
      email: 'school.student@test.com',
      role: 'school_student',
      firstName: 'Ananya',
      lastName: 'Patel',
      gender: 'f',
    },
    {
      email: 'student@test.com',
      role: 'individual_student',
      firstName: 'Arjun',
      lastName: 'Mehta',
      gender: 'm',
    },
  ];

  for (const account of accounts) {
    const existing = await users.findOne({ email: account.email });
    if (existing) {
      console.log(`  ↩ Skipping ${account.email} (already exists)`);
      continue;
    }

    const result = await users.insertOne({
      email: account.email,
      passwordHash,
      firstName: account.firstName,
      lastName: account.lastName,
      gender: account.gender,
      country: 'India',
      role: account.role,
      boardOfEducation: 'CBSE',
      class: 'XII',
      subject: 'Maths',
      schoolId: null,
      classId: null,
      adaptiveLearningEnabled: true,
      emailVerified: true, // pre-verified for testing
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      passwordResetToken: null,
      passwordResetExpiry: null,
      subscriptionTier: account.role === 'individual_student' ? 'free_trial' : 'level_1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await subscriptions.insertOne({
      userId: result.insertedId,
      tier: account.role === 'individual_student' ? 'free_trial' : 'level_1',
      status: 'active',
      startDate: new Date(),
      endDate: null,
      paymentId: null,
      amount: 0,
      currency: 'INR',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  ✓ Created ${account.role}: ${account.email}`);
  }

  console.log('\nDone! All accounts use password: Test1234!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
