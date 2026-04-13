import type { Role, SubscriptionTier } from '@/lib/utils/constants';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'm' | 'f';
  country: string;
  role: Role;
  boardOfEducation: string;
  class: string;
  subject: string;
  schoolId: string | null;
  classId: string | null;
  adaptiveLearningEnabled: boolean;
  subscriptionTier: SubscriptionTier;
  emailVerified: boolean;
  isActive: boolean;
}
