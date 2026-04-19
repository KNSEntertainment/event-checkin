'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Event {
  id: string;
  name: string;
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
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [searchResults, setSearchResults] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [editCounts, setEditCounts] = useState({
    adults_count: 0,
    children_count: 0
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  const fetchEventData = async () => {
    try {
      const [eventRes, statsRes, registrationsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/stats`),
        fetch(`/api/events/${eventId}/registrations`)
      ]);

      if (eventRes.ok && statsRes.ok && registrationsRes.ok) {
        const [eventData, statsData, registrationsData] = await Promise.all([
          eventRes.json(),
          statsRes.json(),
          registrationsRes.json()
        ]);

        setEvent(eventData.event);
        setStats(statsData.stats);
        setAllRegistrations(registrationsData.registrations);
        setSearchResults(registrationsData.registrations);
      } else {
        setError('Failed to load event data');
      }
    } catch (err) {
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(allRegistrations);
      return;
    }

    setSearchLoading(true);
    try {
      const filtered = allRegistrations.filter(reg => 
        reg.phone.includes(searchQuery) || 
        reg.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (err) {
      setError('Search error occurred');
    } finally {
      setSearchLoading(false);
      searchTimeoutRef.current = null;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Filter all registrations based on search query
    if (value.length >= 2) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = allRegistrations.filter(reg => 
          reg.phone.includes(value) || 
          reg.name.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(filtered);
        setSearchLoading(false);
      }, 500); // 500ms delay for debouncing
    } else {
      // Show all registrations if search is too short
      setSearchResults(allRegistrations);
      setSearchLoading(false);
    }
  };

  const startQRScanner = () => {
    setScanning(true);
    setSelectedRegistration(null);
    setSearchResults([]);
    
    // Use setTimeout to ensure DOM is updated before accessing element
    setTimeout(() => {
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        console.error('QR reader element not found');
        setError('QR scanner initialization failed');
        setScanning(false);
        return;
      }

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
    }, 100);
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
          const adultsCount = data.registration.adults_count || 1;
          const childrenCount = data.registration.children_count || 0;
          console.log('Setting edit counts:', { adultsCount, childrenCount });
          setEditCounts({
            adults_count: adultsCount,
            children_count: childrenCount
          });
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

        // Update all registrations
        setAllRegistrations(prev => 
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

  const handleQuickCheckIn = async (registration: Registration) => {
    if (registration.checked_in) return;

    setCheckingIn(true);
    setSelectedRegistration(registration); // Show it's being processed
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/registrations/${registration.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adults_count: registration.adults_count || 1,
          children_count: registration.children_count || 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`${registration.name} checked in successfully!`);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total_checked_in: prev.total_checked_in + 1
        }));

        // Update search results and all registrations
        setSearchResults(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        setAllRegistrations(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        // Clear selected registration after successful check-in
        setTimeout(() => {
          setSelectedRegistration(null);
          setSuccess('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check in');
        setSelectedRegistration(null);
      }
    } catch (err) {
      setError('An error occurred during check-in');
      setSelectedRegistration(null);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickCheckInWithCounts = async (registration: Registration, adultsCount: number, childrenCount: number) => {
    if (registration.checked_in) return;

    setCheckingIn(true);
    setSelectedRegistration(registration); // Show it's being processed
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/registrations/${registration.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adults_count: adultsCount,
          children_count: childrenCount
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`${registration.name} checked in successfully! (${adultsCount} adults, ${childrenCount} children)`);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total_checked_in: prev.total_checked_in + 1
        }));

        // Update search results and all registrations
        setSearchResults(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        setAllRegistrations(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        // Clear selected registration after successful check-in
        setTimeout(() => {
          setSelectedRegistration(null);
          setSuccess('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check in');
        setSelectedRegistration(null);
      }
    } catch (err) {
      setError('An error occurred during check-in');
      setSelectedRegistration(null);
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
            <button
              onClick={() => router.push(`/event/${eventId}`)}
              className="px-4 py-2 mb-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Event
            </button>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Check-in App</h1>
              <p className="mt-1 text-lg text-blue-600">{event?.name}</p>
            </div>
          </div>
        </div>

        {/* Live Stats */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handlePhoneChange}
                  placeholder="Enter phone number (auto-searches as you type)..."
                  className="w-full text-black border border-gray-300 rounded-md px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {/* Search indicator */}
                {searchLoading && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                )}
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
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              <p className="text-sm text-gray-600 mt-1">{searchResults.filter(r => !r.checked_in).length} unchecked registrations</p>
            </div>
            
            
            <div className="space-y-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searchResults.map((registration) => (
                <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{registration.name}</p>
                      <p className="text-sm font-medium text-gray-600">{registration.phone}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        registration.checked_in 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {registration.checked_in ? 'Checked In' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Editable counts for unchecked registrations */}
                  {!registration.checked_in && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Adults
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          defaultValue={registration.adults_count || 1}
                          id={`adults-${registration.id}`}
                          className="w-full text-black border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Children
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          defaultValue={registration.children_count || 0}
                          id={`children-${registration.id}`}
                          className="w-full text-black border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Show original counts for checked in registrations */}
                  {registration.checked_in && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Adults
                        </label>
                        <p className="w-full text-black border border-gray-200 rounded px-2 py-1 bg-gray-50 text-sm">
                          {registration.adults_count}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Children
                        </label>
                        <p className="w-full text-black border border-gray-200 rounded px-2 py-1 bg-gray-50 text-sm">
                          {registration.children_count}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    {!registration.checked_in && (
                      <button
                        onClick={() => {
                          const adultsInput = document.getElementById(`adults-${registration.id}`) as HTMLInputElement;
                          const childrenInput = document.getElementById(`children-${registration.id}`) as HTMLInputElement;
                          const adultsCount = parseInt(adultsInput.value) || 1;
                          const childrenCount = parseInt(childrenInput.value) || 0;
                          handleQuickCheckInWithCounts(registration, adultsCount, childrenCount);
                        }}
                        disabled={checkingIn}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {checkingIn && selectedRegistration?.id === registration.id ? 'Checking in...' : 'Check In'}
                      </button>
                    )}
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
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{selectedRegistration.name}</p>
                <p className="text-sm text-gray-600">{selectedRegistration.phone}</p>
                <p className="text-sm text-gray-600">Adults: {selectedRegistration.adults_count}</p>
                <p className="text-sm text-gray-600">Children: {selectedRegistration.children_count}</p>
                {selectedRegistration.checked_in_at && (
                  <p className="text-sm text-gray-600">
                    Checked in: {new Date(selectedRegistration.checked_in_at).toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Editable counts */}
              {!selectedRegistration.checked_in && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Adults
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={editCounts.adults_count}
                      onChange={(e) => setEditCounts({ ...editCounts, adults_count: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editCounts.children_count}
                      onChange={(e) => setEditCounts({ ...editCounts, children_count: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Display counts when checked in */}
              {selectedRegistration.checked_in && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Adults
                    </label>
                    <p className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 sm:text-sm">
                      {selectedRegistration.adults_count}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Children
                    </label>
                    <p className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 sm:text-sm">
                      {selectedRegistration.children_count}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-4">
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
