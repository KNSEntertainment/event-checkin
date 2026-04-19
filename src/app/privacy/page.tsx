'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'data-collection', title: 'What Data We Collect' },
    { id: 'data-usage', title: 'How We Use Your Data' },
    { id: 'data-protection', title: 'Data Protection & Security' },
    { id: 'user-rights', title: 'Your GDPR Rights' },
    { id: 'data-retention', title: 'Data Retention' },
    { id: 'third-parties', title: 'Third-Party Services' },
    { id: 'contact', title: 'Contact Information' },
  ];

  const content = {
    overview: {
      title: 'Privacy Policy Overview',
      content: `
        <p class="mb-4">This Privacy Policy explains how Event Check-in ("we," "our," or "us") collects, uses, and protects your personal information when you use our event management and check-in services.</p>
        <p class="mb-4">This policy is compliant with the General Data Protection Regulation (GDPR) and applies to all users of our services within the European Union and European Economic Area.</p>
        <p class="mb-4">By using our service, you agree to the collection and use of information in accordance with this policy.</p>
      `
    },
    'data-collection': {
      title: 'What Personal Data We Collect',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-lg mb-2">Account Information</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Email address (for authentication and communications)</li>
              <li>Name (displayed in event listings)</li>
              <li>User ID (internal system identifier)</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Event Information</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Event name and description</li>
              <li>Event organizer name</li>
              <li>Event date, time, and location details</li>
              <li>Parking and venue information</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Registration Information</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Registrant name and contact information</li>
              <li>Phone number (for check-in verification)</li>
              <li>Email address (for event communications)</li>
              <li>Number of adults and children attending</li>
              <li>Check-in status and timestamps</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Technical Data</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>IP address (for security and analytics)</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent</li>
            </ul>
          </div>
        </div>
      `
    },
    'data-usage': {
      title: 'How We Use Your Personal Data',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-lg mb-2">Service Provision</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Create and manage events</li>
              <li>Process event registrations</li>
              <li>Generate QR codes for check-in</li>
              <li>Send event-related communications</li>
              <li>Provide analytics and reporting</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Communication</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Send registration confirmations</li>
              <li>Provide event updates and reminders</li>
              <li>Share check-in QR codes</li>
              <li>Respond to support requests</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Security & Compliance</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Prevent fraudulent activities</li>
              <li>Ensure platform security</li>
              <li>Comply with legal obligations</li>
              <li>Maintain service integrity</li>
            </ul>
          </div>
        </div>
      `
    },
    'data-protection': {
      title: 'Data Protection & Security',
      content: `
        <div class="space-y-4">
          <p class="mb-4">We implement appropriate technical and organizational measures to protect your personal data:</p>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Technical Measures</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Secure HTTPS encryption for all data transmission</li>
              <li>Encrypted database storage</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure backup procedures</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Organizational Measures</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-700">
              <li>Staff training on data protection</li>
              <li>Limited access to personal data</li>
              <li>Data protection policies and procedures</li>
              <li>Regular compliance reviews</li>
            </ul>
          </div>
        </div>
      `
    },
    'user-rights': {
      title: 'Your GDPR Rights',
      content: `
        <div class="space-y-4">
          <p class="mb-4">Under GDPR, you have the following rights regarding your personal data:</p>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Right to Access</h4>
            <p class="text-gray-700 mb-2">You can request a copy of all personal data we hold about you.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Right to Rectification</h4>
            <p class="text-gray-700 mb-2">You can request correction of inaccurate personal data.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Right to Erasure</h4>
            <p class="text-gray-700 mb-2">You can request deletion of your personal data (right to be forgotten).</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Right to Portability</h4>
            <p class="text-gray-700 mb-2">You can request your data in a machine-readable format.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Right to Object</h4>
            <p class="text-gray-700 mb-2">You can object to processing of your personal data.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">How to Exercise Your Rights</h4>
            <p class="text-gray-700 mb-2">To exercise any of these rights, please contact us using the information in the Contact section below. We will respond to your request within 30 days.</p>
          </div>
        </div>
      `
    },
    'data-retention': {
      title: 'Data Retention',
      content: `
        <div class="space-y-4">
          <p class="mb-4">We retain personal data only as long as necessary for the purposes outlined in this policy:</p>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Account Data</h4>
            <p class="text-gray-700 mb-2">Retained until account deletion or 2 years of inactivity.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Event Data</h4>
            <p class="text-gray-700 mb-2">Retained for 1 year after event completion, unless longer retention is required.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Registration Data</h4>
            <p class="text-gray-700 mb-2">Retained for 6 months after event completion, unless longer retention is required.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Technical Logs</h4>
            <p class="text-gray-700 mb-2">Retained for 30 days for security purposes.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Legal Requirements</h4>
            <p class="text-gray-700 mb-2">Some data may be retained longer if required by law or for legitimate business interests.</p>
          </div>
        </div>
      `
    },
    'third-parties': {
      title: 'Third-Party Services',
      content: `
        <div class="space-y-4">
          <p class="mb-4">We use the following third-party services to provide our services:</p>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Clerk (Authentication)</h4>
            <p class="text-gray-700 mb-2">Used for user authentication and account management. Clerk handles authentication data in compliance with GDPR.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">MongoDB (Database)</h4>
            <p class="text-gray-700 mb-2">Used for secure data storage. All data is encrypted and stored in compliance with data protection regulations.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Email Service Providers</h4>
            <p class="text-gray-700 mb-2">Used for sending event communications and notifications. Email data is processed in accordance with GDPR.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Data Processing Agreements</h4>
            <p class="text-gray-700 mb-2">We have appropriate data processing agreements in place with all third-party service providers.</p>
          </div>
        </div>
      `
    },
    'contact': {
      title: 'Contact Information',
      content: `
        <div class="space-y-4">
          <p class="mb-4">If you have any questions about this Privacy Policy or wish to exercise your GDPR rights, please contact us:</p>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-lg mb-2">Data Protection Officer</h4>
            <p class="text-gray-700 mb-2">Email: privacy@eventcheckin.com</p>
            <p class="text-gray-700 mb-2">Response Time: We will respond to your inquiry within 30 days</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Regulatory Authorities</h4>
            <p class="text-gray-700 mb-2">If you believe we have violated your data protection rights, you have the right to lodge a complaint with a supervisory authority in your country.</p>
          </div>
          
          <div>
            <h4 class="font-semibold text-lg mb-2">Policy Updates</h4>
            <p class="text-gray-700 mb-2">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.</p>
          </div>
        </div>
      `
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Navigation */}
            <div className="lg:w-1/4 border-r border-gray-200">
              <nav className="p-4">
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:w-3/4 p-6">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {content[activeSection as keyof typeof content].title}
                </h2>
                <div 
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: content[activeSection as keyof typeof content].content 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Questions about our privacy practices? Contact us at{' '}
                <a href="mailto:privacy@eventcheckin.com" className="text-blue-600 hover:text-blue-800">
                  privacy@eventcheckin.com
                </a>
              </p>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
