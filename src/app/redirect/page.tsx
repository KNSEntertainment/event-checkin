'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function RedirectPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@eventcheckin.com';

  useEffect(() => {
    console.log('Redirect page - User state:', { isSignedIn, userEmail: user?.primaryEmailAddress?.emailAddress, SUPER_ADMIN_EMAIL });
    
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      // Check if user is admin and redirect accordingly
      if (user.primaryEmailAddress.emailAddress === SUPER_ADMIN_EMAIL) {
        console.log('Redirecting to admin...');
        router.push('/admin');
      } else {
        console.log('Redirecting to dashboard...');
        router.push('/dashboard');
      }
    } else if (!isSignedIn) {
      console.log('Not signed in, redirecting to sign-in...');
      router.push('/sign-in');
    }
  }, [isSignedIn, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
