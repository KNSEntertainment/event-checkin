'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

interface Event {
  id: string;
  name: string;
  date: string;
  organizer_id: string;
}

interface Registration {
  id: string;
  name: string;
  phone: string;
  children_count: number;
  checked_in: boolean;
  created_at: string;
}

interface EventStats {
  total_registered: number;
  total_checked_in: number;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<EventStats>({ total_registered: 0, total_checked_in: 0 });
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
      } else {
        setError('Failed to load event data');
      }
    } catch (err) {
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const registrationURL = typeof window !== 'undefined' 
    ? `${window.location.origin}/register/${eventId}`
    : '';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Event Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="mt-2 text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => router.push(`/checkin/${eventId}`)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Open Check-in App
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Registered</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.total_registered}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Checked In</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.total_checked_in}</p>
          </div>
        </div>

        {/* Registration QR Code */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registration QR Code</h2>
          <div className="flex items-center space-x-8">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={registrationURL} size={200} />
            </div>
            <div>
              <p className="text-gray-600 mb-4">
                Share this QR code for people to register for your event.
              </p>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600 font-mono break-all">{registrationURL}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Registrations</h2>
            <span className="text-sm text-gray-600">
              {registrations.length} total
            </span>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No registrations yet</p>
              <p className="text-sm text-gray-400 mt-2">Share the QR code to start collecting registrations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Children
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.children_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          registration.checked_in 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.checked_in ? 'Checked In' : 'Not Checked In'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
