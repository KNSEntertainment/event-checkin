'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Event {
  id: string;
  name: string;
  date: string;
}

interface Registration {
  id: string;
  name: string;
  phone: string;
  children_count: number;
  checked_in: boolean;
  checked_in_at?: string;
}

interface EventStats {
  total_registered: number;
  total_checked_in: number;
}

export default function CheckinAppPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats>({ total_registered: 0, total_checked_in: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const [eventRes, statsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/stats`)
      ]);

      if (eventRes.ok && statsRes.ok) {
        const [eventData, statsData] = await Promise.all([
          eventRes.json(),
          statsRes.json()
        ]);

        setEvent(eventData.event);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/search?phone=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.registrations);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError('Search error occurred');
    }
  };

  const startQRScanner = () => {
    setScanning(true);
    setSelectedRegistration(null);
    setSearchResults([]);

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        // Extract registration ID from URL
        const urlParts = decodedText.split('/');
        const registrationId = urlParts[urlParts.length - 1];
        
        if (registrationId) {
          fetchRegistrationById(registrationId);
        }
        scanner.clear();
        setScanning(false);
      },
      (errorMessage) => {
        // Handle scan errors silently
      }
    );

    scannerRef.current = scanner;
  };

  const stopQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const fetchRegistrationById = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.registration.event_id === eventId) {
          setSelectedRegistration(data.registration);
          setSearchResults([]);
        } else {
          setError('This registration is for a different event');
        }
      } else {
        setError('Registration not found');
      }
    } catch (err) {
      setError('Failed to load registration');
    }
  };

  const handleCheckIn = async (registration: Registration) => {
    if (registration.checked_in) return;

    setCheckingIn(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/registrations/${registration.id}/checkin`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedRegistration(result.registration);
        setSuccess('Successfully checked in!');
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total_checked_in: prev.total_checked_in + 1
        }));

        // Update search results if applicable
        setSearchResults(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        setTimeout(() => setSuccess(''), 3000);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading check-in app...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Check-in App</h1>
              <p className="mt-1 text-lg text-blue-600">{event?.name}</p>
            </div>
            <button
              onClick={() => router.push(`/event/${eventId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Event
            </button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Registered</h3>
            <p className="mt-2 text-4xl font-bold text-blue-600">{stats.total_registered}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Checked In</h3>
            <p className="mt-2 text-4xl font-bold text-green-600">{stats.total_checked_in}</p>
          </div>
        </div>

        {/* Check-in Methods */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Check-in Methods</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Search */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Search by Phone</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter phone number..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* QR Scanner */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Scan QR Code</h3>
              {!scanning ? (
                <button
                  onClick={startQRScanner}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Start Scanner
                </button>
              ) : (
                <button
                  onClick={stopQRScanner}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Stop Scanner
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QR Scanner Area */}
        {scanning && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code Scanner</h3>
            <div id="qr-reader" className="mx-auto"></div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
            <div className="space-y-3">
              {searchResults.map((registration) => (
                <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{registration.name}</p>
                      <p className="text-sm text-gray-600">{registration.phone}</p>
                      <p className="text-sm text-gray-600">Children: {registration.children_count}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        registration.checked_in 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {registration.checked_in ? 'Checked In' : 'Not Checked In'}
                      </span>
                      {!registration.checked_in && (
                        <button
                          onClick={() => handleCheckIn(registration)}
                          disabled={checkingIn}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Registration */}
        {selectedRegistration && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Details</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{selectedRegistration.name}</p>
                <p className="text-sm text-gray-600">{selectedRegistration.phone}</p>
                <p className="text-sm text-gray-600">Children: {selectedRegistration.children_count}</p>
                {selectedRegistration.checked_in_at && (
                  <p className="text-sm text-gray-600">
                    Checked in: {new Date(selectedRegistration.checked_in_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedRegistration.checked_in 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedRegistration.checked_in ? 'Checked In' : 'Not Checked In'}
                </span>
                {!selectedRegistration.checked_in && (
                  <button
                    onClick={() => handleCheckIn(selectedRegistration)}
                    disabled={checkingIn}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-lg font-medium"
                  >
                    {checkingIn ? 'Checking in...' : 'Check In'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
