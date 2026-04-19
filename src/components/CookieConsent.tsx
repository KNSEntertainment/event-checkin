'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieConsentProps {
  onAccept?: (analytics: boolean) => void;
}

export default function CookieConsent({ onAccept }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [essential, setEssential] = useState(true); // Essential cookies are always required
  const [focusedButton, setFocusedButton] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Parse stored consent
      try {
        const parsed = JSON.parse(consent);
        setAnalytics(parsed.analytics || false);
        if (onAccept) {
          onAccept(parsed.analytics || false);
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        setIsVisible(true);
      }
    }
  }, [onAccept]);

  const handleAccept = (analyticsEnabled: boolean = false) => {
    const consent = {
      essential: true,
      analytics: analyticsEnabled,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setAnalytics(analyticsEnabled);
    setIsVisible(false);
    
    if (onAccept) {
      onAccept(analyticsEnabled);
    }
  };

  const handleSaveSettings = () => {
    handleAccept(analytics);
  };

  const handleReject = () => {
    handleAccept(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {!showSettings ? (
          // Simple consent banner
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p id="cookie-consent-description" className="text-sm text-gray-700">
                <span className="font-semibold">Cookie Notice:</span> We use cookies to enhance your experience and analyze site traffic. 
                By continuing to use our site, you agree to our use of cookies. 
                <Link 
                  href="/privacy" 
                  className="text-blue-600 hover:text-blue-800 underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Read our privacy policy to learn more about cookies"
                >
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Cookie consent options">
              <button
                onClick={() => setShowSettings(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowSettings(true);
                  }
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Customize cookie preferences"
              >
                Customize
              </button>
              <button
                onClick={handleReject}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleReject();
                  }
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Reject all non-essential cookies"
              >
                Reject All
              </button>
              <button
                onClick={() => handleAccept(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAccept(true);
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Accept all cookies including analytics"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed settings panel
          <div className="space-y-4">
            <div>
              <h3 id="cookie-consent-title" className="text-lg font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose which types of cookies you'd like to allow. You can change your preferences at any time.
              </p>
            </div>
            
            <div className="space-y-3" role="group" aria-label="Cookie type selections">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                  <p className="text-sm text-gray-600">Required for the website to function properly</p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={essential}
                    disabled
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-not-allowed opacity-50"
                    aria-label="Essential cookies are always enabled"
                    aria-describedby="essential-cookies-description"
                  />
                  <span id="essential-cookies-description" className="ml-2 text-sm text-gray-500">Always enabled</span>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600">Help us understand how our website is being used</p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle analytics cookies"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setAnalytics(!analytics);
                        }
                      }}
                    />
                    <div 
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                      role="switch"
                      aria-checked={analytics}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setAnalytics(!analytics);
                        }
                      }}
                    ></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200" role="group" aria-label="Cookie preference actions">
              <button
                onClick={() => setShowSettings(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowSettings(false);
                  }
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Cancel and return to simple cookie consent"
              >
                Cancel
              </button>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleReject}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleReject();
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Reject all non-essential cookies"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSaveSettings}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSaveSettings();
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Save cookie preferences"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
