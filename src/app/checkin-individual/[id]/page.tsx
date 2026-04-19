'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

interface Registration {
  id: string;
  name: string;
  phone: string;
  email?: string;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-200 border-t-transparent animate-pulse"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading registration...</p>
        </div>
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Registration Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
         
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Event Check-in</h1>
          <p className="text-lg text-gray-600 mt-2">Quick and secure check-in for registered attendees</p>
        </div>

        {registration && (
          <div className="max-w-xl md:mx-auto mx-4">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    registration.checked_in ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Name</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{registration.name}</p>
                  </div>

            

                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Phone</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{registration.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adults</label>
                      {!registration.checked_in ? (
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={editCounts.adults_count}
                          onChange={(e) => setEditCounts({ ...editCounts, adults_count: parseInt(e.target.value) || 1 })}
                          className="mt-1 w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900 mt-1">{registration.adults_count}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Children</label>
                      {!registration.checked_in ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={editCounts.children_count}
                          onChange={(e) => setEditCounts({ ...editCounts, children_count: parseInt(e.target.value) || 0 })}
                          className="mt-1 w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900 mt-1">{registration.children_count}</p>
                      )}
                    </div>
                  </div>

                  {/* <div className="flex items-center pt-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                      registration.checked_in 
                        ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'
                    }`}>
                      {registration.checked_in ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Checked In
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m0 0l-3-3m3 3V8m0 0a9 9 0 110-18 9 9 0 0118 0z" />
                          </svg>
                          Not Checked In
                        </div>
                      )}
                    </div>
                  </div> */}
                </div>

                {/* Check-in Button */}
                {!registration.checked_in && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg transform hover:scale-105"
                  >
                    {checkingIn ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Checking in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Check In
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>

                      </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-red-800">Error</h4>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
 
        </div>
      </div>
    </div>
  );
}
