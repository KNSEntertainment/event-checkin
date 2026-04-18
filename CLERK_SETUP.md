# Clerk Authentication Setup Guide

## 1. Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Select "Next.js" as the framework
4. Choose authentication providers (Google is recommended)

## 2. Configure Environment Variables

Replace the placeholder values in `.env.local`:

```bash
# Get these from your Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY

# Optional: Customize redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/create-event
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/create-event
```

## 3. Configure Google OAuth

In your Clerk Dashboard:
1. Go to "User & Authentication" → "Social Connections"
2. Enable "Google"
3. Add your Google OAuth credentials
4. Configure redirect URLs for your domain

## 4. Test Authentication

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In to Create Event"
4. Test Google sign-in flow
5. Verify you can create events after signing in

## 5. Deploy to Vercel

1. Add Clerk environment variables to Vercel
2. Deploy your application
3. Test authentication in production

## Features Implemented

✅ **Authentication Required**: Users must sign in to create events
✅ **Google OAuth**: Integrated Google sign-in
✅ **Protected Routes**: Middleware protects authenticated routes
✅ **User Profile**: Shows user email and sign-out option
✅ **API Protection**: API routes require valid Clerk session
✅ **Database Integration**: Uses Clerk user ID for data association

## Public vs Protected Routes

**Public Routes** (No authentication required):
- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/register/*` - Event registration pages
- `/checkin-individual/*` - Individual check-in pages

**Protected Routes** (Authentication required):
- `/create-event` - Create new events
- `/event/*` - Event management pages
- `/checkin/*` - Check-in app for organizers
- `/api/events` - Event creation API
