'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

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
  created_at: string;
}

interface Registration {
  id: string;
  name: string;
  phone: string;
  adults_count: number;
  children_count: number;
  checked_in: boolean;
  checked_in_at?: string;
}

export default function DashboardPage() {
  const { isSignedIn, user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [eventStats, setEventStats] = useState<{[key: string]: { adults: number; children: number } }>({});
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const router = useRouter();
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@eventcheckin.com';

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    fetchEvents();
  }, [isSignedIn]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        
        // Fetch stats for each event
        const statsPromises = data.events.map(async (event: Event) => {
          try {
            const statsResponse = await fetch(`/api/events/${event.id}/stats`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              return { eventId: event.id, stats: statsData.stats };
            }
            return { eventId: event.id, stats: { total_registered: 0, total_checked_in: 0 } };
          } catch (err) {
            return { eventId: event.id, stats: { total_registered: 0, total_checked_in: 0 } };
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const newStats: {[key: string]: { adults: number; children: number }} = {};
        
        statsResults.forEach(({ eventId, stats }) => {
          newStats[eventId] = {
            adults: stats.adults || 0,
            children: stats.children || 0
          };
        });

        setEventStats(newStats);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Prevent duplicate calls
    if (deletingEventId === eventId) {
      return;
    }

    // First get event details and registration count
    try {
      setDeletingEventId(eventId);
      
      const eventResponse = await fetch(`/api/events/${eventId}`);
      const event = eventResponse.ok ? (await eventResponse.json()).event : null;
      
      const statsResponse = await fetch(`/api/events/${eventId}/stats`);
      const stats = statsResponse.ok ? (await statsResponse.json()).stats : null;
      
      const totalPeople = (stats?.adults || 0) + (stats?.children || 0);
      const totalRegistrations = stats?.total_registered || 0;
      
      const confirmationMessage = `Are you sure you want to delete this event?

${event ? `Event: ${event.name}` : 'This event'}
${totalPeople > 0 ? `People: ${totalPeople} (${totalRegistrations} registration${totalRegistrations !== 1 ? 's' : ''})` : ''}

IMPORTANT: All registrants with email addresses will receive a cancellation email notification.

This action cannot be undone.`;

      if (!confirm(confirmationMessage)) {
        setDeletingEventId(null);
        return;
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const result = await response.json();
        const message = result.emailsSent > 0 
          ? `Event deleted successfully. ${result.emailsSent} cancellation emails were sent to registrants.`
          : 'Event deleted successfully.';
        
        setSuccess(message);
        setEvents(events.filter(event => event.id !== eventId));
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Error deleting event');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleDownloadReport = async (eventId: string, eventName: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from Content-Disposition header or create one
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `event-${eventId}-report.csv`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download report');
      }
    } catch (err) {
      setError('Error downloading report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Events Dashboard
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage your events and track registrations in real-time
                </p>
                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="ml-2 text-sm text-gray-600">{events.length} Active Events</span>
                  </div>
             
                </div>
              </div>
              <div className="flex space-x-3">
                {/* Admin Access Button */}
                {user?.primaryEmailAddress?.emailAddress === SUPER_ADMIN_EMAIL && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/create-event"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Event
                </Link>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No events yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start organizing amazing events by creating your first event. It's quick and easy!
            </p>
            <Link
              href="/create-event"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const isUpcoming = eventDate > new Date();
              const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.name}
                        </h3>
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {event.organizer}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {eventDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isUpcoming 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isUpcoming ? `${daysUntil} day/s away` : 'Past event'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadReport(event.id, event.name)}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Report"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {eventStats[event.id]?.adults || 0}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Adults</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {eventStats[event.id]?.children || 0}
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Children</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/event/${event.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Manage
                      </Link>
                      <Link
                        href={`/checkin/${event.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Check-in
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deletingEventId === event.id}
                        className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingEventId === event.id ? (
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
