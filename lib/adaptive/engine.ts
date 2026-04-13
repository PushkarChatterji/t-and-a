/**
 * Adaptive learning engine.
 *
 * Given a user + chapter, determines the appropriate difficulty and returns
 * the next unattempted question at that level.
 *
 * Difficulty progression (Focus → Practice → Challenge):
 *   - Start at Focus
 *   - Once >= ADAPTIVE_THRESHOLD "done" questions at Focus    -> move to Practice
 *   - Once >= ADAPTIVE_THRESHOLD "done" questions at Practice -> move to Challenge
 *   - If no questions remain at the target level, try the next level up,
 *     then wrap back to Focus.
 */

import type mongoose from 'mongoose';
import StudentProgress from '@/lib/db/models/StudentProgress';
import Question from '@/lib/db/models/Question';
import { ADAPTIVE_THRESHOLD } from '@/lib/utils/constants';

const DIFFICULTY_ORDER = ['Focus', 'Practice', 'Challenge'] as const;
type Difficulty = typeof DIFFICULTY_ORDER[number];

interface AdaptiveOptions {
  userId: string;
  chapter: string;
  board?: string;
  year?: string;
  subject?: string;
}

interface AdaptiveResult {
  question: mongoose.Document | null;
  difficulty: Difficulty;
  reason: 'adaptive' | 'fallback' | 'exhausted';
}

export async function getNextAdaptiveQuestion(opts: AdaptiveOptions): Promise<AdaptiveResult> {
  const { userId, chapter, board, year, subject } = opts;

  // Count "done" at each difficulty level for this user + chapter
  const progressRecords = await StudentProgress.aggregate([
    {
      $match: {
        userId: new (await import('mongoose')).default.Types.ObjectId(userId),
        status: 'done',
      },
    },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'q',
      },
    },
    { $unwind: '$q' },
    { $match: { 'q.chapter_name': chapter } },
    {
      $group: {
        _id: '$q.difficulty_level',
        count: { $sum: 1 },
      },
    },
  ]);

  const doneCounts: Record<string, number> = { Focus: 0, Practice: 0, Challenge: 0 };
  for (const r of progressRecords) doneCounts[r._id] = r.count;

  // Determine target difficulty
  let targetDifficulty: Difficulty;
  if (doneCounts.Practice >= ADAPTIVE_THRESHOLD) {
    targetDifficulty = 'Challenge';
  } else if (doneCounts.Focus >= ADAPTIVE_THRESHOLD) {
    targetDifficulty = 'Practice';
  } else {
    targetDifficulty = 'Focus';
  }

  // IDs already attempted
  const attemptedProgress = await StudentProgress.find({
    userId,
    status: { $in: ['done', 'need_clarification', 'need_help'] },
  }).lean();
  const attemptedIds = attemptedProgress.map(p => p.questionId);

  const baseFilter: Record<string, unknown> = {
    chapter_name: chapter,
    _id: { $nin: attemptedIds },
  };
  if (board) baseFilter.edu_board = board;
  if (year) baseFilter.year = year;
  if (subject) baseFilter.subject = subject;

  // Try target difficulty, then cycle through others
  const order: Difficulty[] = [
    targetDifficulty,
    ...DIFFICULTY_ORDER.filter(d => d !== targetDifficulty),
  ];

  for (const diff of order) {
    const count = await Question.countDocuments({ ...baseFilter, difficulty_level: diff });
    if (count === 0) continue;

    const skip = Math.floor(Math.random() * count);
    const question = await Question.findOne({ ...baseFilter, difficulty_level: diff }).skip(skip).lean();
    if (question) {
      return {
        question,
        difficulty: diff,
        reason: diff === targetDifficulty ? 'adaptive' : 'fallback',
      };
    }
  }

  return { question: null, difficulty: targetDifficulty, reason: 'exhausted' };
}
