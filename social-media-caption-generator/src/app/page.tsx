import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/landing-page';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}