import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rob@schoolbolts.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

/**
 * Returns the session if the user is an admin, or null otherwise.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return null;
  return session;
}
