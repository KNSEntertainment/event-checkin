# Event Check-in App

A simple, fast event management system with QR code check-in capabilities. Perfect for conferences, meetings, and gatherings.

## Features

- **Event Creation**: Create events with name, date, and basic registration fields
- **Mobile Registration**: Mobile-first registration forms that work perfectly on phones and tablets
- **QR Code Generation**: Automatic QR code generation for each registration
- **Dual Check-in Methods**: Check in attendees by scanning QR codes OR searching by phone number
- **Live Statistics**: Real-time count of registered vs checked-in attendees
- **Simple Database**: SQLite database with events, registrations, and organizers

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with custom database layer
- **QR Code**: react-qr-code for display, html5-qrcode for scanning
- **UI**: Tailwind CSS with responsive design

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### 1. Create an Event
- Go to `/create-event`
- Enter event name, date, and your email
- Get your event dashboard with QR code for registration

### 2. Registration
- Share the event QR code or registration link
- People register with name, phone, and number of children
- Each registration gets a unique QR code for check-in

### 3. Check-in
- Open the check-in app from your event dashboard
- **Method 1**: Scan registration QR codes with camera
- **Method 2**: Search by phone number
- Click "Check In" to mark attendance

### 4. Live Stats
- See total registered vs checked-in attendees
- View all registrations and their status
- Export data (feature coming soon)

## Project Structure

```
src/
|-- app/
|   |-- page.tsx                    # Landing page
|   |-- create-event/page.tsx       # Event creation form
|   |-- event/[id]/page.tsx         # Event dashboard
|   |-- register/[id]/page.tsx      # Public registration form
|   |-- checkin/[id]/page.tsx       # Individual check-in
|   |-- checkin/[eventId]/page.tsx  # Check-in app for organizers
|   |-- api/                        # API routes
|       |-- events/                 # Event CRUD
|       |-- registrations/          # Registration operations
|       |-- events/[id]/            # Event-specific endpoints
|       |-- registrations/[id]/      # Registration-specific endpoints
|-- lib/
|   |-- database.ts                 # SQLite database operations
|   |-- qr-code.ts                  # QR code utilities
```

## Database Schema

### Events
- id (UUID)
- name (string)
- date (string)
- organizer_id (UUID)

### Registrations
- id (UUID)
- event_id (UUID)
- name (string)
- phone (string)
- children_count (number)
- checked_in (boolean)
- checked_in_at (datetime)

### Organizers
- id (UUID)
- email (string)

## API Endpoints

### Events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `GET /api/events/[id]/registrations` - Get all registrations
- `GET /api/events/[id]/stats` - Get event statistics
- `GET /api/events/[id]/search?phone=` - Search by phone
- `POST /api/events/[id]/register` - Create registration

### Registrations
- `GET /api/registrations/[id]` - Get registration details
- `POST /api/registrations/[id]/checkin` - Check in registration

## Development

The project uses Next.js 16 with the App Router pattern. All database operations use SQLite with a custom async wrapper.

### Adding New Features

1. Database operations: Add to `src/lib/database.ts`
2. API endpoints: Add to appropriate `src/app/api/` directory
3. Pages: Add to `src/app/` directory
4. Components: Add to `src/components/` (create as needed)

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## Future Enhancements

- [ ] Offline check-in with local caching
- [ ] Export to Excel/CSV
- [ ] Multi-tenant organization support
- [ ] Email notifications
- [ ] Custom registration fields
- [ ] Check-in analytics
- [ ] Mobile app

## License

MIT License - feel free to use this for your events!
