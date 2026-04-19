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
  checkinURL: string;
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
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
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
          padding: 20px;
          border-radius: 8px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .qr-code img {
          max-width: 200px;
          height: auto;
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
        
        <p>Thank you for registering for <strong>${data.eventName}</strong>. Your registration has been confirmed and we're excited to see you there!</p>

        <div class="event-info">
          <h3>Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          ${data.eventVenue ? `<p><strong>Venue:</strong> ${data.eventVenue}</p>` : ''}
          ${data.eventAddress ? `<p><strong>Address:</strong> ${data.eventAddress}</p>` : ''}
        </div>

        <div class="qr-section">
          <h3>Your Check-in QR Code</h3>
          <p>Save this QR code or take a screenshot for quick check-in at the event entrance:</p>
          <div class="qr-code">
            <img src="${qrCodeDataURL}" alt="Check-in QR Code" />
          </div>
          
          <div class="checkin-url">
            <strong>Check-in URL:</strong><br>
            ${data.checkinURL}
          </div>
        </div>

        <p style="text-align: center;">
          <a href="${data.checkinURL}" class="button">View Check-in Page</a>
        </p>

        <div class="footer">
          <p>This QR code is unique to your registration. Please do not share it with others.</p>
          <p>If you have any questions, please contact the event organizers.</p>
          <p>See you at the event!</p>
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
