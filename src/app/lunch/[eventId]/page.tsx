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
  adults: number;
  children: number;
  lunchAdults: number;
  lunchChildren: number;
}

export default function LunchVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats>({ total_registered: 0, total_checked_in: 0, total_lunch_served: 0, adults: 0, children: 0, lunchAdults: 0, lunchChildren: 0 });
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [servingLunch, setServingLunch] = useState(false);
  const [success, setSuccess] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // Phone search state
  const [searchQuery, setSearchQuery] = useState('');
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [searchResults, setSearchResults] = useState<Registration[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lunch selection state
  const [lunchSelection, setLunchSelection] = useState({
    adults: 0,
    children: 0
  });

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

  const startQRScanner = () => {
    setScanning(true);
    setSelectedRegistration(null);
    
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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(allRegistrations);
      return;
    }

    setSearchLoading(true);
    try {
      const filtered = allRegistrations.filter(reg => 
        reg.phone.includes(searchQuery)
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
    
    // Filter all registrations based on phone number
    if (value.length >= 3) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = allRegistrations.filter(reg => 
          reg.phone.includes(value)
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

  const handleServeLunch = async (registration: Registration, adults: number = 0, children: number = 0) => {
    const adultsToServe = adults > 0 ? adults : lunchSelection.adults;
    const childrenToServe = children > 0 ? children : lunchSelection.children;
    
    if (adultsToServe === 0 && childrenToServe === 0) {
      setError('Please select at least one person to serve lunch');
      return;
    }

    setServingLunch(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/registrations/${registration.id}/lunch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adults_lunch_served: adultsToServe,
          children_lunch_served: childrenToServe
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedRegistration(result.registration);
        setSuccess('Lunch served successfully!');
        
        // Update stats with the actual served counts
        setStats(prev => ({
          ...prev,
          total_lunch_served: prev.total_lunch_served + (adultsToServe + childrenToServe),
          lunchAdults: prev.lunchAdults + adultsToServe,
          lunchChildren: prev.lunchChildren + childrenToServe
        }));

        // Update search results if applicable
        setSearchResults(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        // Update all registrations to keep in sync
        setAllRegistrations(prev => 
          prev.map(r => r.id === registration.id ? result.registration : r)
        );

        // Reset selection
        setLunchSelection({ adults: 0, children: 0 });
        
        // Clear input fields
        const adultsInput = document.getElementById(`adults-${registration.id}`) as HTMLInputElement;
        const childrenInput = document.getElementById(`children-${registration.id}`) as HTMLInputElement;
        const totalSpan = document.getElementById(`total-${registration.id}`) as HTMLSpanElement;
        if (adultsInput) adultsInput.value = '0';
        if (childrenInput) childrenInput.value = '0';
        if (totalSpan) totalSpan.textContent = '0';
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to serve lunch');
      }
    } catch (err) {
      setError('An error occurred during lunch service');
    } finally {
      setServingLunch(false);
    }
  };

  const handleRegistrationSelect = (registration: Registration) => {
    setSelectedRegistration(registration);
    // Reset lunch selection when selecting a new registration
    setLunchSelection({ adults: 0, children: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lunch verification...</p>
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
              className="px-4 mb-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Event
            </button>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lunch Verification</h1>
              <p className="mt-1 text-lg text-blue-600">{event?.name}</p>
            </div>
          </div>
        </div>

        {/* Lunch Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lunch Service Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.total_checked_in}</div>
              <div className="text-xs text-gray-600 mt-1">Checked In Families</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.lunchAdults + stats.lunchChildren} of {stats.adults + stats.children}</div>
              <div className="text-xs text-gray-600 mt-1">Lunch Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.lunchAdults}/{stats.adults}</div>
              <div className="text-xs text-gray-600 mt-1">Adults Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-pink-600">{stats.lunchChildren}/{stats.children}</div>
              <div className="text-xs text-gray-600 mt-1">Children Served</div>
            </div>
          </div>
   
        </div>

        {/* Lunch Verification Methods */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lunch Verification Methods</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
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
            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((registration) => (
                <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{registration.name} ({registration.adults_count}A , {registration.children_count}C)</p>
                      <p className="text-sm text-gray-600">{registration.phone}</p>
                   
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-4 py-2 text-md font-semibold rounded-full ${
                          registration.lunch_served 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.lunch_served ? `${stats.lunchAdults + stats.lunchChildren} of ${stats.adults + stats.children} served` : 'Lunch Pending'}
                        </span>
                      </div>
                    </div>
                         {/* Lunch Selection Interface */}
                  </div>
              {registration.checked_in && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Select No. of People to Serve Lunch</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adults ({registration.adults_count - registration.adults_lunch_served} available)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={registration.adults_count - registration.adults_lunch_served}
                        defaultValue="0"
                        className="w-full text-black border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        id={`adults-${registration.id}`}
                        onChange={() => {
                          const adultsInput = document.getElementById(`adults-${registration.id}`) as HTMLInputElement;
                          const childrenInput = document.getElementById(`children-${registration.id}`) as HTMLInputElement;
                          const totalSpan = document.getElementById(`total-${registration.id}`) as HTMLSpanElement;
                          const adults = parseInt(adultsInput.value) || 0;
                          const children = parseInt(childrenInput.value) || 0;
                          totalSpan.textContent = (adults + children).toString();
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Children ({registration.children_count - registration.children_lunch_served} available)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={registration.children_count - registration.children_lunch_served}
                        defaultValue="0"
                        className="w-full text-black border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        id={`children-${registration.id}`}
                        onChange={() => {
                          const adultsInput = document.getElementById(`adults-${registration.id}`) as HTMLInputElement;
                          const childrenInput = document.getElementById(`children-${registration.id}`) as HTMLInputElement;
                          const totalSpan = document.getElementById(`total-${registration.id}`) as HTMLSpanElement;
                          const adults = parseInt(adultsInput.value) || 0;
                          const children = parseInt(childrenInput.value) || 0;
                          totalSpan.textContent = (adults + children).toString();
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mb-4">
                    <span>Total selected: <span id={`total-${registration.id}`}>0</span> people</span>
                  </div>
                  <button
                    onClick={() => {
                      const adultsInput = document.getElementById(`adults-${registration.id}`) as HTMLInputElement;
                      const childrenInput = document.getElementById(`children-${registration.id}`) as HTMLInputElement;
                      const adults = parseInt(adultsInput.value) || 0;
                      const children = parseInt(childrenInput.value) || 0;
                      
                      if (adults === 0 && children === 0) {
                        setError('Please select at least one person to serve lunch');
                        return;
                      }
                      
                      handleServeLunch(registration, adults, children);
                    }}
                    disabled={servingLunch || (registration.adults_lunch_served >= registration.adults_count && registration.children_lunch_served >= registration.children_count)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-lg font-medium"
                  >
                    {servingLunch ? 'Serving...' : (registration.adults_lunch_served >= registration.adults_count && registration.children_lunch_served >= registration.children_count) ? 'All Served' : 'Serve Lunch'}
                  </button>
                </div>
              )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Registration */}
        {/* {selectedRegistration && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Details</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{selectedRegistration.name}</p>
                <p className="text-sm text-gray-600">{selectedRegistration.phone}</p>
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-gray-600">
                    Adults: {selectedRegistration.adults_count}
                    {selectedRegistration.adults_lunch_served > 0 && (
                      <span className="ml-2 text-orange-600">({selectedRegistration.adults_lunch_served}/{selectedRegistration.adults_count} already served)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Children: {selectedRegistration.children_count}
                    {selectedRegistration.children_lunch_served > 0 && (
                      <span className="ml-2 text-orange-600">({selectedRegistration.children_lunch_served}/{selectedRegistration.children_count} already served)</span>
                    )}
                  </div>
                </div>
                {selectedRegistration.checked_in_at && (
                  <p className="text-sm text-gray-600 mt-2">
                    Checked in: {new Date(selectedRegistration.checked_in_at).toLocaleString()}
                  </p>
                )}
                {selectedRegistration.lunch_served_at && (
                  <p className="text-sm text-gray-600">
                    Lunch served: {new Date(selectedRegistration.lunch_served_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Lunch Selection Interface */}
              {/* {selectedRegistration.checked_in && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Select People to Serve Lunch</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adults ({selectedRegistration.adults_count - selectedRegistration.adults_lunch_served} available)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedRegistration.adults_count - selectedRegistration.adults_lunch_served}
                        value={lunchSelection.adults}
                        onChange={(e) => setLunchSelection(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Children ({selectedRegistration.children_count - selectedRegistration.children_lunch_served} available)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedRegistration.children_count - selectedRegistration.children_lunch_served}
                        value={lunchSelection.children}
                        onChange={(e) => setLunchSelection(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mb-4">
                    <span>Total selected: {lunchSelection.adults + lunchSelection.children} people</span>
                  </div>
                </div>
              )}
            </div> */}
            
            {/* <div className="flex items-center space-x-3 mt-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                selectedRegistration.checked_in 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedRegistration.checked_in ? 'Checked In' : 'Not Checked In'}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                selectedRegistration.lunch_served 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedRegistration.lunch_served ? 'Lunch Served' : 'Lunch Pending'}
              </span>
              {selectedRegistration.checked_in && (
                <button
                  onClick={() => handleServeLunch(selectedRegistration)}
                  disabled={servingLunch || (lunchSelection.adults === 0 && lunchSelection.children === 0)}
                  className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-lg font-medium"
                >
                  {servingLunch ? 'Serving...' : `Serve Lunch (${lunchSelection.adults + lunchSelection.children} people)`}
                </button>
              )}
            </div>
          </div>
        )} */} 

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
