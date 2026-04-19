'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';

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

interface RegistrationData {
  name: string;
  phone: string;
  address: string;
  email?: string;
  adults_count: number | string;
  children_count: number | string;
}

interface AddressSuggestion {
  id: string;
  label: string;       // full formatted address shown in dropdown
  addressLine: string; // street + housenumber
  city: string;
  postalCode: string;
}

interface GeoapifyProperties {
  place_id?: string | number;
  formatted?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  postcode?: string;
}

interface GeoapifyFeature {
  id?: string | number;
  properties?: GeoapifyProperties;
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[];
}

export default function RegisterPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    phone: '',
    address: '',
    email: '',
    adults_count: 1,
    children_count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isAddressSelected, setIsAddressSelected] = useState(false);

  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

  useEffect(() => {
    if (eventId) fetchEvent();
  }, [eventId]);

  // Geoapify autocomplete — debounced with AbortController, mirrors the reference implementation
  useEffect(() => {
    if (!geoapifyKey) {
      setAddressSuggestions([]);
      return;
    }
    if (!formData.address || formData.address.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    if (isAddressSelected) {
      setIsAddressSelected(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        setAddressError('');

        const text = encodeURIComponent(formData.address.trim());
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&limit=6&type=street&apiKey=${geoapifyKey}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch address suggestions');

        const data = (await res.json()) as GeoapifyResponse;

        const suggestions: AddressSuggestion[] = (data.features || []).map(
          (feature: GeoapifyFeature) => {
            const props = feature.properties || {};
            const addressLine =
              [props.street, props.housenumber].filter(Boolean).join(' ').trim() ||
              props.formatted ||
              '';
            const city =
              props.city ||
              props.town ||
              props.village ||
              props.municipality ||
              props.county ||
              '';
            const postalCode = props.postcode || '';

            return {
              id:
                props.place_id?.toString() ||
                feature?.id?.toString() ||
                `${addressLine}-${postalCode}`,
              label: props.formatted || addressLine || 'Unknown address',
              addressLine: addressLine || props.formatted || '',
              city,
              postalCode,
            };
          }
        );

        setAddressSuggestions(suggestions);
        setActiveSuggestionIndex(suggestions.length > 0 ? 0 : -1);
      } catch (err: unknown) {
        if (!(err instanceof Error) || err.name !== 'AbortError') {
          setAddressError('Could not load address suggestions.');
        }
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.address, geoapifyKey]);

  // Selecting a suggestion fills the single address field with the full formatted label
  const applySuggestion = (item: AddressSuggestion) => {
    setFormData(prev => ({ ...prev, address: item.label }));
    setAddressSuggestions([]);
    setActiveSuggestionIndex(-1);
    setIsAddressSelected(true);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, address: e.target.value }));
    setAddressError('');
    setActiveSuggestionIndex(-1);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (addressSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % addressSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(
        prev => (prev - 1 + addressSuggestions.length) % addressSuggestions.length
      );
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      applySuggestion(addressSuggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setAddressSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      } else {
        setError('Event not found');
      }
    } catch {
      setError('Failed to load event information');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Convert string values to numbers for submission
    const submissionData = {
      ...formData,
      adults_count: formData.adults_count === '' ? 1 : parseInt(formData.adults_count.toString()),
      children_count: formData.children_count === '' ? 0 : parseInt(formData.children_count.toString()),
    };

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();
        setRegistrationId(result.registration.id);
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to register');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600">Event Not Found</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success && registrationId) {
    const checkinURL =
      typeof window !== 'undefined'
        ? `${window.location.origin}/checkin-individual/${registrationId}`
        : '';

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Registration Successful!</h1>
            <p className="mt-2 text-gray-600">You're registered for {event?.name}</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Your Check-in QR Code</h2>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCode value={checkinURL} size={200} />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Show this QR code at the event entrance for quick check-in
            </p>
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-xs text-gray-600 font-mono text-center break-all">{checkinURL}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Save this QR code or take a screenshot for easy access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register for the Event</h1>
          {event && (
            <>
              <p className="mt-2 text-lg font-medium text-blue-600">{event.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Ram Bahadur Lama"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                minLength={8}
                maxLength={8}
                required
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="46565456"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Address - single field, Geoapify autocomplete */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address *
              </label>
              <div className="relative mt-1">
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.address}
                  onChange={handleAddressChange}
                  onKeyDown={handleAddressKeyDown}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-8 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Start typing your street address..."
                />

                {addressLoading && (
                  <div className="absolute right-2 top-2.5 pointer-events-none">
                    <svg
                      className="animate-spin h-4 w-4 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}

                {addressError && (
                  <p className="text-xs text-red-600 mt-1">{addressError}</p>
                )}

                {addressSuggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((item, index) => (
                      <li
                        key={item.id}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          index === activeSuggestionIndex
                            ? 'bg-blue-50 text-gray-900'
                            : 'text-gray-900 hover:bg-gray-50'
                        }`}
                        onMouseDown={e => {
                          e.preventDefault(); // keep input focused until selection commits
                          applySuggestion(item);
                        }}
                      >
                        <div className="font-medium truncate">{item.label}</div>
                        {(item.postalCode || item.city) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {[item.postalCode, item.city].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Type your full street address including postal code
              </p>
            </div>

            {/* Adults */}
            <div>
              <label htmlFor="adults_count" className="block text-sm font-medium text-gray-700">
                Number of Adults *
              </label>
              <input
                id="adults_count"
                name="adults_count"
                type="number"
                min="1"
                max="20"
                required
                value={formData.adults_count}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData(prev => ({ ...prev, adults_count: '' }));
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setFormData(prev => ({ ...prev, adults_count: numValue }));
                    }
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Children */}
            <div>
              <label htmlFor="children_count" className="block text-sm font-medium text-gray-700">
                Number of Children
              </label>
              <input
                id="children_count"
                name="children_count"
                type="number"
                min="0"
                max="20"
                value={formData.children_count}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData(prev => ({ ...prev, children_count: '' }));
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setFormData(prev => ({ ...prev, children_count: numValue }));
                    }
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registering...' : 'Register for Event'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to share your information with the event organizers
          </p>
        </div>
      </div>
    </div>
  );
}