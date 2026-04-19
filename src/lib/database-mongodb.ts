import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-checkin';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Event Schema
const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String },
  end_time: { type: String },
  venue: { type: String },
  address: { type: String },
  parking_info: { type: String },
  organizer_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Registration Schema
const RegistrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  event_id: { type: String, required: true, ref: 'Event' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  adults_count: { type: Number, required: true, default: 1 },
  children_count: { type: Number, required: true, default: 0 },
  checked_in: { type: Boolean, required: true, default: false },
  checked_in_at: { type: Date },
  lunch_served: { type: Boolean, required: true, default: false },
  lunch_served_at: { type: Date },
  adults_lunch_served: { type: Number, required: true, default: 0 },
  children_lunch_served: { type: Number, required: true, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// Organizer Schema
const OrganizerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clerk_user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Create models
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', OrganizerSchema);

// Database connection
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Event operations
export const createEvent = async (db: any, eventData: {
  id: string;
  name: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  parking_info?: string;
  organizer_id: string;
}) => {
  const event = new Event(eventData);
  await event.save();
  return event.toObject();
};

export const getEventById = async (db: any, eventId: string) => {
  const event = await Event.findOne({ id: eventId });
  return event ? event.toObject() : null;
};

export const getEventsByOrganizer = async (organizerId: string) => {
  const events = await Event.find({ organizer_id: organizerId }).sort({ created_at: -1 });
  return events.map(event => event.toObject());
};

export const updateEvent = async (db: any, eventId: string, updateData: { 
  name?: string; 
  date?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  parking_info?: string;
}) => {
  const event = await Event.findOneAndUpdate(
    { id: eventId }, 
    updateData, 
    { new: true }
  );
  return event ? event.toObject() : null;
};

// Registration operations
export const createRegistration = async (db: any, registrationData: {
  event_id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  adults_count?: number;
  children_count?: number;
}) => {
  const registration = new Registration({
    id: new mongoose.Types.ObjectId().toString(),
    ...registrationData,
    adults_count: (registrationData.adults_count !== undefined && registrationData.adults_count !== null) ? registrationData.adults_count : 1,
    children_count: (registrationData.children_count !== undefined && registrationData.children_count !== null) ? registrationData.children_count : 0,
  });
  await registration.save();
  return registration.toObject();
};

export const getRegistrations = async (db: any, event_id: string) => {
  const registrations = await Registration.find({ event_id }).sort({ created_at: -1 });
  return registrations.map(reg => reg.toObject());
};

export const getRegistrationById = async (db: any, registrationId: string) => {
  const registration = await Registration.findOne({ id: registrationId });
  return registration ? registration.toObject() : null;
};

export const updateRegistration = async (db: any, registrationId: string, updateData: {
  checked_in?: boolean;
  checked_in_at?: Date;
}) => {
  const registration = await Registration.findOneAndUpdate(
    { id: registrationId }, 
    updateData, 
    { new: true }
  );
  return registration ? registration.toObject() : null;
};

export const updateRegistrationLunch = async (db: any, registrationId: string, updateData: { 
  lunch_served: boolean; 
  lunch_served_at?: Date;
  adults_lunch_served?: number;
  children_lunch_served?: number;
}) => {
  const registration = await Registration.findOneAndUpdate(
    { id: registrationId }, 
    updateData, 
    { new: true }
  );
  return registration ? registration.toObject() : null;
};

export const searchRegistrationByPhone = async (db: any, eventId: string, phone: string) => {
  const registrations = await Registration.find({ 
    event_id: eventId, 
    phone: { $regex: phone, $options: 'i' } 
  }).sort({ created_at: -1 });
  return registrations.map(reg => reg.toObject());
};

export const getEventStats = async (db: any, event_id: string) => {
  const eventRegistrations = await Registration.find({ event_id });
  
  const total_registered = eventRegistrations.length;
  const total_checked_in = eventRegistrations.filter(reg => reg.checked_in).length;
  const total_lunch_served = eventRegistrations.filter(reg => reg.lunch_served).length;
  
  // Calculate adults and children counts
  const adults = eventRegistrations.reduce((sum, reg) => sum + (reg.adults_count || 1), 0);
  const children = eventRegistrations.reduce((sum, reg) => sum + (reg.children_count || 0), 0);
  
  // Calculate lunch served adults and children counts using individual tracking
  const lunchAdults = eventRegistrations.reduce((sum, reg) => sum + (reg.adults_lunch_served || 0), 0);
  const lunchChildren = eventRegistrations.reduce((sum, reg) => sum + (reg.children_lunch_served || 0), 0);
  
  return { total_registered, total_checked_in, total_lunch_served, adults, children, lunchAdults, lunchChildren };
};

// Organizer operations
export const createOrganizer = async (db: any, clerkUserId: string, email: string) => {
  const organizer = new Organizer({
    id: new mongoose.Types.ObjectId().toString(),
    clerk_user_id: clerkUserId,
    email,
  });
  await organizer.save();
  return organizer.toObject();
};

export const getOrganizerByClerkId = async (db: any, clerkUserId: string) => {
  const organizer = await Organizer.findOne({ clerk_user_id: clerkUserId });
  return organizer ? organizer.toObject() : null;
};

export const deleteEvent = async (db: any, eventId: string) => {
  const result = await Event.findByIdAndDelete(eventId);
  return result ? result.toObject() : null;
};

export const getEventsByClerkId = async (db: any, clerkUserId: string) => {
  const events = await Event.find({ organizer_id: clerkUserId }).sort({ created_at: -1 });
  return events.map(event => event.toObject());
};

export default {
  connectDB,
  createEvent,
  getEventById,
  getEventsByOrganizer,
  getEventsByClerkId,
  updateEvent,
  deleteEvent,
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  updateRegistrationLunch,
  searchRegistrationByPhone,
  getEventStats,
  createOrganizer,
  getOrganizerByClerkId,
};
