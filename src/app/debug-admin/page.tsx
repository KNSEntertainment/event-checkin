'use client';

import { useUser } from '@clerk/nextjs';

export default function DebugAdminPage() {
  const { isSignedIn, user } = useUser();
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@eventcheckin.com';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <strong>Environment Variable:</strong> {SUPER_ADMIN_EMAIL}
          </div>
          
          <div>
            <strong>Is Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}
          </div>
          
          <div>
            <strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'Not loaded'}
          </div>
          
          <div>
            <strong>Is Admin:</strong> {user?.primaryEmailAddress?.emailAddress === SUPER_ADMIN_EMAIL ? 'Yes' : 'No'}
          </div>
          
          <div>
            <strong>Full User Object:</strong>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="mt-6 space-x-4">
          {user?.primaryEmailAddress?.emailAddress === SUPER_ADMIN_EMAIL ? (
            <a href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Go to Admin Dashboard
            </a>
          ) : (
            <a href="/dashboard" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Go to User Dashboard
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
