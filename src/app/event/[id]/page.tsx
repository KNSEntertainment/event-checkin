'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

interface Event {
  id: string;
  name: string;
  organizer: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  parking_info?: string;
  organizer_id: string;
}

interface Registration {
  id: string;
  name: string;
  phone: string;
  adults_count: number;
  children_count: number;
  checked_in: boolean;
  checked_in_at?: string;
  lunch_served: boolean;
  lunch_served_at?: string;
  adults_lunch_served: number;
  children_lunch_served: number;
  created_at: string;
}

interface EventStats {
  total_registered: number;
  total_checked_in: number;
  total_lunch_served: number;
  lunchAdults: number;
  lunchChildren: number;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<EventStats>({ total_registered: 0, total_checked_in: 0, total_lunch_served: 0, lunchAdults: 0, lunchChildren: 0 });
  const [totalCounts, setTotalCounts] = useState({ total_adults: 0, total_children: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const [eventRes, registrationsRes, statsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/registrations`),
        fetch(`/api/events/${eventId}/stats`)
      ]);

      if (eventRes.ok && registrationsRes.ok && statsRes.ok) {
        const [eventData, registrationsData, statsData] = await Promise.all([
          eventRes.json(),
          registrationsRes.json(),
          statsRes.json()
        ]);

        setEvent(eventData.event);
        setRegistrations(registrationsData.registrations);
        setStats(statsData.stats);
        
        // Calculate total adults and children counts
        const totalAdults = registrationsData.registrations.reduce((sum: number, reg: Registration) => sum + (reg.adults_count || 1), 0);
        const totalChildren = registrationsData.registrations.reduce((sum: number, reg: Registration) => sum + (reg.children_count || 0), 0);
        
        setTotalCounts({
          total_adults: totalAdults,
          total_children: totalChildren
        });
      } else {
        setError('Failed to load event data');
      }
    } catch (err) {
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const [registrationURL, setRegistrationURL] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRegistrationURL(`${window.location.origin}/register/${eventId}`);
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/create-event')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {event.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {event.start_time && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {event.venue}
                  </div>
                )}
              </div>
              {event.address && (
                <div className="mt-2 text-sm text-gray-600 flex items-start">
                  <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.address}
                </div>
              )}
              {event.parking_info && (
                <div className="mt-2 text-sm text-gray-600 flex items-start">
                  <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{event.parking_info}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/checkin/${eventId}`)}
                className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Check-in
              </button>
              <button
                onClick={() => router.push(`/lunch/${eventId}`)}
                className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Lunch Verification
              </button>
            </div>
          </div>
        </div>

        {/* Compact Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.total_registered}</div>
              <div className="text-xs text-gray-600 mt-1">Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.total_checked_in}</div>
              <div className="text-xs text-gray-600 mt-1">Checked In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.total_lunch_served}</div>
              <div className="text-xs text-gray-600 mt-1">Lunch Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.lunchAdults}</div>
              <div className="text-xs text-gray-600 mt-1">Adults Lunch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-pink-600">{stats.lunchChildren}</div>
              <div className="text-xs text-gray-600 mt-1">Children Lunch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{totalCounts.total_adults + totalCounts.total_children}</div>
              <div className="text-xs text-gray-600 mt-1">Total People</div>
            </div>
          </div>
        </div>

        {/* Event Poster Section */}
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-lg border border-gray-200 p-8 mb-6 text-gray-900">
          <div className="max-w-md flex flex-col items-center mx-auto">
            {/* Event Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event?.name}</h1>
              <div className="flex items-center justify-center text-xl text-gray-700 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{event?.organizer}</span>
              </div>
              <div className="flex flex-col justify-center items-center gap-2 text-lg">
                <div className="flex items-center font-semibold">
                
                  <span>{new Date(event?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center font-semibold">
            
                  <span>{event?.start_time} - {event?.end_time}</span>
                </div>
                <div className="flex items-center font-semibold">
               
                  <span>{event?.venue}</span>
                </div>
                <div className="flex items-center text-gray-600">
               
                  <span>({event?.parking_info})</span>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="w-full sm:max-w-sm bg-white bg-opacity-95 rounded-xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Scan to Register</h2>
            
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                {/* QR Code */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-200">
                  <QRCode value={registrationURL} size={200} />
                </div>
                
            
              </div>
            </div>
                  <div className="max-w-sm bg-gray-50 mt-6 p-2 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-mono mb-2 break-all">{registrationURL}</p>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(registrationURL);
                          alert('Link copied to clipboard!');
                        } catch (err) {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = registrationURL;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="mt-3 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
          </div>
        </div>

        {/* Compact Registrations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Registrations</h2>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                {registrations.length} groups
              </span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                {totalCounts.total_adults} adults
              </span>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                {totalCounts.total_children} children
              </span>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No registrations yet</p>
              <p className="text-sm text-gray-400 mt-2">Share the QR code to start collecting registrations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div key={registration.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {registration.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{registration.name}</p>
                          <p className="text-sm text-gray-600">{registration.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium">
                          {registration.adults_count} {registration.adults_count === 1 ? 'Adult' : 'Adults'}
                        </span>
                        {registration.children_count > 0 && (
                          <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-medium">
                            {registration.children_count} {registration.children_count === 1 ? 'Child' : 'Children'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          registration.checked_in 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.checked_in ? 'Checked In' : 'Pending'}
                        </span>
                        {registration.checked_in && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            registration.adults_lunch_served > 0 || registration.children_lunch_served > 0
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {registration.adults_lunch_served + registration.children_lunch_served > 0 
                              ? `${registration.adults_lunch_served + registration.children_lunch_served} of ${registration.adults_count + registration.children_count} lunch served`
                              : 'Lunch Pending'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Registered: {new Date(registration.created_at).toLocaleDateString()}</span>
                    {registration.checked_in_at && (
                      <span>Checked in: {new Date(registration.checked_in_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
