export const ROLES = {
  INDIVIDUAL_STUDENT: 'individual_student',
  SCHOOL_STUDENT: 'school_student',
  TEACHER: 'teacher',
  MANAGEMENT: 'management',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const QUESTION_STATUS = {
  DONE: 'done',
  NEED_HELP: 'need_help',
  UNATTEMPTED: 'unattempted',
} as const;

export type QuestionStatus = (typeof QUESTION_STATUS)[keyof typeof QUESTION_STATUS];

export const DIFFICULTY_LEVELS = ['Focus', 'Practice', 'Challenge'] as const;
export type Difficulty = typeof DIFFICULTY_LEVELS[number];

export const SUBSCRIPTION_TIER = {
  FREE_TRIAL: 'free_trial',
  LEVEL_1: 'level_1',
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export const ACTIVITY_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  QUESTION_LIST_CREATED: 'question_list_created',
  QUESTION_LIST_ASSIGNED: 'question_list_assigned',
  QUESTION_IMPORTED: 'question_imported',
  PASSWORD_RESET: 'password_reset',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  AUTO_LOGOFF: 'auto_logoff',
} as const;

export const ADAPTIVE_THRESHOLD = parseInt(process.env.ADAPTIVE_THRESHOLD ?? '5', 10);
export const AUTO_LOGOFF_MINUTES = parseInt(process.env.AUTO_LOGOFF_MINUTES ?? '120', 10);
