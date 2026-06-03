import { IUser } from '../types';

export function isAdminUser(user: Pick<IUser, 'email' | 'role'>): boolean {
  if (user.role === 'admin') return true;
  const raw = process.env.ADMIN_EMAILS || '';
  const allowlist = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(user.email.toLowerCase());
}
