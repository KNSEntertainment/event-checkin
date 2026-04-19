'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function CreateEventPage() {
  const { isSignedIn, user } = useUser();
  const [formData, setFormData] = useState({
    organizer: '',
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    venue: '',
    address: '',
    parking_info: '',
  });

  // Address autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);

  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addressInputRef.current &&
        !addressInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddressSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setAddressLoading(true);
    try {
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', query);
      url.searchParams.set('limit', '6');
      url.searchParams.set('apiKey', geoapifyKey || '');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Geoapify request failed');

      const data = await res.json();
      const features = data?.features || [];
      setSuggestions(features);
      setShowSuggestions(features.length > 0);
      setActiveSuggestion(-1);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setAddressLoading(false);
    }
  }, [geoapifyKey]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, address: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAddressSuggestions(value), 300);
  };

  const handleSuggestionSelect = (feature: any) => {
    const formatted = feature.properties.formatted;
    setFormData(prev => ({ ...prev, address: formatted }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    addressInputRef.current?.focus();
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizerEmail: user?.primaryEmailAddress?.emailAddress
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Event created successfully!');
        setTimeout(() => {
          router.push(`/event/${result.event.id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create event');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Event
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Set up your event with all the important details
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Event Organizer */}
              <div>
                <label htmlFor="organizer" className="block text-lg font-semibold text-gray-900 mb-2">
                  Event Organizer *
                </label>
                <input
                  id="organizer"
                  name="organizer"
                  type="text"
                  required
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  className="mt-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Your name or organization"
                />
              </div>

              {/* Event Name */}
              <div>
                <label htmlFor="name" className="block text-lg font-semibold text-gray-900 mb-2">
                  Event Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Annual Company Meeting"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="date" className="block text-lg font-semibold text-gray-900 mb-2">
                    Event Date *
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 pr-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="start_time" className="block text-lg font-semibold text-gray-900 mb-2">
                    Start Time
                  </label>
                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="mt-1 pr-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-lg font-semibold text-gray-900 mb-2">
                    End Time
                  </label>
                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="mt-1 pr-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block text-lg font-semibold text-gray-900 mb-2">
                  Event Venue
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="mt-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Conference Hall A, Main Auditorium, etc."
                />
              </div>

              {/* Address with Geoapify autocomplete */}
              <div>
                <label htmlFor="address" className="block text-lg font-semibold text-gray-900 mb-2">
                  Event Address
                </label>
                <div className="relative mt-1">
                  <input
                    id="address"
                    name="address"
                    type="text"
                    ref={addressInputRef}
                    value={formData.address}
                    onChange={handleAddressChange}
                    onKeyDown={handleAddressKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="block w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Start typing your event address..."
                  />

                  {/* Loading indicator */}
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    {addressLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Suggestion dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      role="listbox"
                      className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-64 overflow-y-auto divide-y divide-gray-100"
                    >
                      {suggestions.map((feature: any, index) => {
                        const { formatted, postcode, city } = feature.properties;
                        const isActive = index === activeSuggestion;
                        return (
                          <li
                            key={index}
                            role="option"
                            aria-selected={isActive}
                            onMouseDown={e => {
                              e.preventDefault();
                              handleSuggestionSelect(feature);
                            }}
                            onMouseEnter={() => setActiveSuggestion(index)}
                            className={`px-4 py-3 cursor-pointer flex items-start gap-3 ${
                              isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <svg
                              className="h-5 w-5 mt-0.5 shrink-0 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 truncate">{formatted}</p>
                              {(postcode || city) && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {[postcode, city].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Type the full address including postal code for better accuracy
                </p>
              </div>

              {/* Parking Information */}
              <div>
                <label htmlFor="parking_info" className="block text-lg font-semibold text-gray-900 mb-2">
                  Parking Information (Optional)
                </label>
                <textarea
                  id="parking_info"
                  name="parking_info"
                  rows={3}
                  value={formData.parking_info}
                  onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
                  className="mt-1 block w-full min-w-0 border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Free parking available on-site, paid parking across the street, etc."
                />
              </div>



              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
