import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ComputersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/reservations');

  redirect('/reservations');
}
