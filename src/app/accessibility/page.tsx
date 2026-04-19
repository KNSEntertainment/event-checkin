'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AccessibilityPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Accessibility Statement
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Event Check-in is committed to ensuring digital accessibility for people with disabilities. 
            We are continually improving the user experience for everyone and applying the relevant 
            accessibility standards.
          </p>
        </div>

        {/* Compliance Status */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Compliance Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">WCAG 2.1 Level AA</h3>
              <p className="text-green-700">
                We aim to conform to Level AA of the Web Content Accessibility Guidelines (WCAG) 2.1.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Section 508</h3>
              <p className="text-blue-700">
                Our website is designed to be compliant with Section 508 standards.
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accessibility Features</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Keyboard Navigation</h3>
              <p className="text-gray-700">
                Our website can be fully navigated using a keyboard. All interactive elements are 
                reachable and operable through keyboard commands.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Screen Reader Support</h3>
              <p className="text-gray-700">
                We use semantic HTML and ARIA labels to ensure compatibility with screen readers 
                like JAWS, NVDA, and VoiceOver.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Color Contrast</h3>
              <p className="text-gray-700">
                All text meets or exceeds WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Focus Indicators</h3>
              <p className="text-gray-700">
                Clear focus indicators are provided for all interactive elements to help keyboard users.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Skip Links</h3>
              <p className="text-gray-700">
                Skip navigation links allow users to jump directly to main content and navigation areas.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-gray-700">
                Our website works well across different devices and screen sizes, including mobile devices.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="space-y-6">
            <div>
              <button
                onClick={() => toggleSection('html')}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={activeSection === 'html'}
                aria-controls="html-content"
              >
                <span className="font-semibold text-gray-900">Semantic HTML Structure</span>
                <svg 
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${activeSection === 'html' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeSection === 'html' && (
                <div id="html-content" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Proper heading hierarchy (h1, h2, h3)</li>
                    <li>Semantic landmarks (header, main, footer, nav)</li>
                    <li>Proper list structures</li>
                    <li>Form labels and associations</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggleSection('aria')}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={activeSection === 'aria'}
                aria-controls="aria-content"
              >
                <span className="font-semibold text-gray-900">ARIA Labels & Roles</span>
                <svg 
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${activeSection === 'aria' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeSection === 'aria' && (
                <div id="aria-content" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Descriptive labels for interactive elements</li>
                    <li>Role attributes for custom components</li>
                    <li>Live regions for dynamic content</li>
                    <li>State announcements for screen readers</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggleSection('keyboard')}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={activeSection === 'keyboard'}
                aria-controls="keyboard-content"
              >
                <span className="font-semibold text-gray-900">Keyboard Accessibility</span>
                <svg 
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${activeSection === 'keyboard' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeSection === 'keyboard' && (
                <div id="keyboard-content" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Tab order follows visual order</li>
                    <li>Enter and Space key support for buttons</li>
                    <li>Escape key to close modals and dropdowns</li>
                    <li>Arrow key navigation within components</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Testing & Feedback */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing & Feedback</h2>
          <p className="text-gray-700 mb-4">
            We regularly test our website using various tools and methods to ensure accessibility:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Automated accessibility testing tools</li>
            <li>Manual keyboard navigation testing</li>
            <li>Screen reader testing with multiple devices</li>
            <li>Color contrast validation</li>
            <li>User testing with people with disabilities</li>
          </ul>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Feedback Welcome</h3>
            <p className="text-blue-700 mb-4">
              If you experience any accessibility issues or have suggestions for improvement, 
              please let us know. We value your feedback and are committed to making our website 
              accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:accessibility@eventcheckin.com" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Email Us
              </a>
              <Link 
                href="/privacy#contact"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Contact Form
              </Link>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-gray-600">
          <p className="mb-2">
            This accessibility statement was last updated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}.
          </p>
          <p className="text-sm">
            We review this statement regularly and update it as our accessibility efforts evolve.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
