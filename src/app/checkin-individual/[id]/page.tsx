'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Registration {
  id: string;
  name: string;
  phone: string;
  adults_count: number;
  children_count: number;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
}

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.id as string;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editCounts, setEditCounts] = useState({
    adults_count: 0,
    children_count: 0
  });

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    }
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      if (response.ok) {
        const data = await response.json();
        setRegistration(data.registration);
        setEditCounts({
          adults_count: data.registration.adults_count || 1,
          children_count: data.registration.children_count || 0
        });
      } else {
        setError('Registration not found');
      }
    } catch (err) {
      setError('Failed to load registration information');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!registration || registration.checked_in) return;

    setCheckingIn(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/registrations/${registrationId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adults_count: editCounts.adults_count,
          children_count: editCounts.children_count
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setRegistration(result.registration);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check in');
      }
    } catch (err) {
      setError('An error occurred during check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration...</p>
        </div>
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600">Registration Not Found</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Check-in</h1>
          <p className="mt-2 text-gray-600">Quick check-in for registered attendees</p>
        </div>

        {registration && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-6">
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-green-800 font-medium">Successfully checked in!</span>
                  </div>
                </div>
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {registration.name}
              </h2>
              
              {/* Editable counts when not checked in */}
              {!registration.checked_in && (
                <div className="space-y-3 text-left">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Adults:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={editCounts.adults_count}
                      onChange={(e) => setEditCounts({ ...editCounts, adults_count: parseInt(e.target.value) || 1 })}
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Children:</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editCounts.children_count}
                      onChange={(e) => setEditCounts({ ...editCounts, children_count: parseInt(e.target.value) || 0 })}
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Display counts when checked in */}
              {registration.checked_in && (
                <div className="space-y-3 text-left">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Adults:</span>
                    <span className="font-medium">{registration.adults_count}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Children:</span>
                    <span className="font-medium">{registration.children_count}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 mt-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  registration.checked_in 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {registration.checked_in ? 'Checked In' : 'Not Checked In'}
                </span>
                {!registration.checked_in && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-lg font-medium"
                  >
                    {checkingIn ? 'Checking in...' : 'Check In'}
                  </button>
                )}
              </div> {registration.checked_in && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-center text-gray-600">
                    This person has already been checked in
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
