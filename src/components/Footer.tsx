'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Event Check-in</span>
            </div>
            <p className="text-gray-600 text-sm">
              Simple and fast event check-in system for conferences, meetings, and gatherings.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2" role="list">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Navigate to home page"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Navigate to dashboard"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/create-event" 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Create a new event"
                >
                  Create Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2" role="list">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Read our privacy policy"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/accessibility" 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Read our accessibility statement"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    // Show cookie consent settings
                    const consent = localStorage.getItem('cookie-consent');
                    if (consent) {
                      localStorage.removeItem('cookie-consent');
                      window.location.reload();
                    }
                  }}
                  className="text-gray-600 bg-gray-200 hover:text-gray-900 text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Manage cookie preferences"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Event Check-in. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 text-sm">
                Compliant with GDPR and data protection regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
