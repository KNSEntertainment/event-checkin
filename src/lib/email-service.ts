import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface WelcomeEmailData {
  eventName: string;
  eventDate: string;
  eventVenue?: string;
  eventAddress?: string;
  registrationId: string;
  userName: string;
  userPhone: string;
  checkinURL: string;
}

interface EventCancellationEmailData {
  eventName: string;
  eventDate: string;
  eventVenue?: string;
  eventAddress?: string;
  userName: string;
}

// Create transporter
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  };

  return nodemailer.createTransport(config);
};

// Generate QR code as base64 data URL
const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for better scanning
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Create HTML email template
const createWelcomeEmailTemplate = async (data: WelcomeEmailData): Promise<string> => {
  const qrCodeDataURL = await generateQRCode(data.checkinURL);
  
  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.eventName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .event-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .event-info h3 {
          color: #007bff;
          margin-top: 0;
        }
        .qr-section {
          text-align: center;
          margin: 30px 0;
        }
        .qr-code {
          background-color: white;
          padding: 25px;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #e9ecef;
        }
        .qr-code img {
          display: block !important;
          max-width: 250px !important;
          height: auto !important;
          border: 1px solid #dee2e6;
        }
        .checkin-url {
          background-color: #e9ecef;
          padding: 15px;
          border-radius: 5px;
          word-break: break-all;
          font-family: monospace;
          font-size: 12px;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Registration Confirmed! </h1>
          <p>Welcome to ${data.eventName}</p>
        </div>

        <p>Hi ${data.userName},</p>
        
        <p>Thank you for registering for <strong>${data.eventName}</strong>. Your registration has been confirmed and we're excited to see you there! Please either show screenshot of QR code for attending the event or remember the phone number ${data.userPhone} you have used to register for the event. </p>

        <div class="event-info">
          <h3>Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          ${data.eventVenue ? `<p><strong>Venue:</strong> ${data.eventVenue}</p>` : ''}
          ${data.eventAddress ? `<p><strong>Address:</strong> ${data.eventAddress}</p>` : ''}
        </div>

        <div class="privacy-notice" style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h4 style="color: #007bff; margin-bottom: 10px; font-size: 16px;">Your Privacy Rights</h4>
          <p style="margin: 5px 0; font-size: 14px;">Your personal data is processed in accordance with our Privacy Policy and applicable data protection laws.</p>
          <p style="margin: 5px 0; font-size: 14px;">You have the right to access, rectify, or delete your personal data at any time.</p>
          <p style="margin: 5px 0; font-size: 14px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/privacy" style="color: #007bff; text-decoration: underline;">Read our Privacy Policy</a> to learn more about your rights.
          </p>
        </div>

        <div class="footer">
          <p>If you have any questions, please contact the event organizers.</p>
          <p>See you at the event!</p>
          <p style="font-size: 12px; color: #6c757d; margin-top: 15px;">
            This email was sent because you registered for ${data.eventName}. 
            You can manage your data privacy settings in your account dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, data: WelcomeEmailData): Promise<void> => {
  try {
    if (!email) {
      console.log('No email provided, skipping welcome email');
      return;
    }

    const transporter = createTransporter();
    const htmlContent = await createWelcomeEmailTemplate(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Event Checkin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${data.eventName} - Your Registration Confirmation`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to avoid breaking registration flow
    // Just log it for debugging
  }
};

// Create event cancellation email template
const createEventCancellationEmailTemplate = (data: EventCancellationEmailData): string => {
  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Cancellation - ${data.eventName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #dc3545;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #dc3545;
          margin: 0;
          font-size: 28px;
        }
        .event-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .event-info h3 {
          color: #dc3545;
          margin-top: 0;
        }
        .apology-section {
          background-color: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Cancellation Notice</h1>
          <p>Important Information About Your Event</p>
        </div>

        <p>Dear ${data.userName},</p>
        
        <p>We regret to inform you that the event <strong>${data.eventName}</strong> has been cancelled.</p>

        <div class="event-info">
          <h3>Cancelled Event Details</h3>
          <p><strong>Event:</strong> ${data.eventName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          ${data.eventVenue ? `<p><strong>Venue:</strong> ${data.eventVenue}</p>` : ''}
          ${data.eventAddress ? `<p><strong>Address:</strong> ${data.eventAddress}</p>` : ''}
        </div>

        <div class="apology-section">
          <h3>We're Sorry</h3>
          <p>We sincerely apologize for any inconvenience this cancellation may cause. This decision was not made lightly, and we understand that you may have made arrangements to attend.</p>
        </div>

        <p>If you have already made any payments or arrangements related to this event, please contact the event organizers directly for information about refunds or next steps.</p>

        <p>We appreciate your understanding and hope to see you at future events.</p>

        <div class="privacy-notice" style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h4 style="color: #dc3545; margin-bottom: 10px; font-size: 16px;">Data Processing Notice</h4>
          <p style="margin: 5px 0; font-size: 14px;">Your registration data for this cancelled event will be handled according to our data retention policy.</p>
          <p style="margin: 5px 0; font-size: 14px;">You can request deletion of your personal data at any time through your account settings.</p>
          <p style="margin: 5px 0; font-size: 14px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/privacy" style="color: #dc3545; text-decoration: underline;">View our Privacy Policy</a> for more information.
          </p>
        </div>

        <div class="footer">
          <p>Thank you for your patience and understanding.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p style="font-size: 12px; color: #6c757d; margin-top: 15px;">
            This email was sent regarding the cancellation of ${data.eventName}. 
            Your data privacy rights remain in effect.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send event cancellation email
export const sendEventCancellationEmail = async (email: string, data: EventCancellationEmailData): Promise<void> => {
  try {
    if (!email) {
      console.log('No email provided, skipping cancellation email');
      return;
    }

    const transporter = createTransporter();
    const htmlContent = createEventCancellationEmailTemplate(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Event Checkin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Event Cancelled - ${data.eventName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event cancellation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending event cancellation email:', error);
    // Don't throw error to avoid breaking deletion flow
    // Just log it for debugging
  }
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};
