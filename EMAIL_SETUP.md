# Email Setup Guide

This guide explains how to configure the welcome email system that sends users a confirmation email with their QR code when they register for an event.

## Overview

When a user provides their email address during registration, they will automatically receive:
- A welcome email confirming their registration
- Event details (name, date, venue, address)
- A QR code for quick check-in
- A direct link to their check-in page

## Setup Instructions

### 1. Install Dependencies

The following packages are already installed:
- `nodemailer` - For sending emails
- `qrcode` - For generating QR codes

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Event Checkin" <your-email@gmail.com>

# Application URL (for QR code links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Gmail Setup (Recommended)

If using Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security -> 2-Step Verification -> App passwords
   - Generate a new app password for "Event Checkin"
3. Use the app password as `EMAIL_PASS`

### 4. Other Email Providers

For other email providers, update the configuration:

**Outlook/Hotmail:**
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

**Yahoo:**
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

## Testing

### Test Email Configuration

Visit `/api/test-email` to verify your email configuration:
```
http://localhost:3000/api/test-email
```

### Test Registration Flow

1. Register for an event with an email address
2. Check your email for the welcome message
3. Verify the QR code displays correctly

## Email Template Features

The welcome email includes:

- **Professional Design**: Clean, responsive HTML template
- **Event Details**: Name, date, venue, and address
- **QR Code**: Embedded as base64 image for quick check-in
- **Check-in URL**: Direct link to the individual check-in page
- **Mobile Friendly**: Responsive design for all devices

## Error Handling

- Email sending failures won't break the registration process
- Errors are logged to the console for debugging
- Users can still complete registration even if email fails

## Customization

### Modify Email Template

Edit `/src/lib/email-service.ts` to customize:
- Email subject and content
- Styling and colors
- QR code size and appearance

### Add More Email Features

You can extend the system to include:
- Event reminders
- Check-in confirmations
- Event updates
- Post-event surveys

## Production Deployment

For production:

1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Set up proper DNS records (SPF, DKIM)
3. Use transactional email templates
4. Monitor email deliverability

## Troubleshooting

### Common Issues

**"Email configuration is invalid"**
- Check all environment variables are set
- Verify email credentials are correct
- Ensure app password is used for Gmail

**"Failed to generate QR code"**
- Check QR code library installation
- Verify check-in URL format

**Email not received**
- Check spam/junk folder
- Verify email address is correct
- Check email logs for errors

### Debug Mode

Add more detailed logging by modifying the email service to log additional information during development.

## Security Notes

- Store email credentials securely in environment variables
- Use app passwords instead of main account passwords
- Consider using email services with better security for production
- Don't commit `.env.local` to version control
