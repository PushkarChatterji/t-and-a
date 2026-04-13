import { v4 as uuidv4 } from 'uuid';

export function generateVerificationToken(): { token: string; expiry: Date } {
  const token = uuidv4();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expiry };
}

export function generatePasswordResetToken(): { token: string; expiry: Date } {
  const token = uuidv4();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return { token, expiry };
}
