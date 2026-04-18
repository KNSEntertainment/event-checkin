import { v4 as uuidv4 } from 'uuid';

// In-memory storage for Vercel deployment
// Note: This will reset on each function cold start
let events: any[] = [];
let registrations: any[] = [];
let organizers: any[] = [];

// Database setup (no-op for in-memory)
export const initDB = () => {
  return {}; // Return mock DB object
};

// Event operations
export const createEvent = async (db: any, eventData: {
  name: string;
  date: string;
  organizer_id: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  parking_info?: string;
}) => {
  const id = uuidv4();
  const event = { 
    id, 
    ...eventData, 
    created_at: new Date().toISOString() 
  };
  events.push(event);
  return event;
};

export const getEvents = async (db: any, organizer_id: string) => {
  return events.filter(event => event.organizer_id === organizer_id);
};

export const getEventsByClerkId = async (db: any, clerk_user_id: string) => {
  // First find the organizer by Clerk ID
  const organizer = organizers.find(org => org.clerk_user_id === clerk_user_id);
  if (!organizer) return [];
  
  // Then get events for that organizer
  return events.filter(event => event.organizer_id === organizer.id);
};

export const getEvent = async (db: any, event_id: string) => {
  return events.find(event => event.id === event_id);
};

export const deleteEvent = async (db: any, event_id: string) => {
  const index = events.findIndex(event => event.id === event_id);
  if (index !== -1) {
    events.splice(index, 1);
  }
};

export const updateEvent = async (db: any, event_id: string, updateData: { name?: string; date?: string }) => {
  const index = events.findIndex(event => event.id === event_id);
  if (index !== -1) {
    events[index] = { ...events[index], ...updateData };
    return events[index];
  }
  return null;
};

export const updateRegistrationLunch = async (db: any, registration_id: string, updateData: { 
  lunch_served: boolean; 
  lunch_served_at?: string;
  adults_lunch_served?: number;
  children_lunch_served?: number;
}) => {
  const index = registrations.findIndex(reg => reg.id === registration_id);
  if (index !== -1) {
    registrations[index] = { ...registrations[index], ...updateData };
    return registrations[index];
  }
  return null;
};

// Registration operations
interface Registration {
  id: string;
  event_id: string;
  name?: string;
  phone?: string;
  address?: string;
  adults_count: number;
  children_count: number;
  checked_in: boolean;
  checked_in_at?: string;
  lunch_served: boolean;
  lunch_served_at?: string;
  adults_lunch_served: number;
  children_lunch_served: number;
  created_at: string;
}

export const createRegistration = async (db: any, registrationData: {
  event_id: string;
  name?: string;
  phone?: string;
  address?: string;
  adults_count?: number;
  children_count?: number;
}) => {
  const id = uuidv4();
  const registration: Registration = { 
    id, 
    event_id: registrationData.event_id,
    name: registrationData.name || '',
    phone: registrationData.phone || '',
    address: registrationData.address || '',
    adults_count: (registrationData.adults_count !== undefined && registrationData.adults_count !== null) ? registrationData.adults_count : 1,
    children_count: (registrationData.children_count !== undefined && registrationData.children_count !== null) ? registrationData.children_count : 0,
    checked_in: false,
    lunch_served: false,
    adults_lunch_served: 0,
    children_lunch_served: 0,
    created_at: new Date().toISOString() 
  };
  registrations.push(registration);
  return registration;
};

export const getRegistrations = async (db: any, event_id: string) => {
  return registrations.filter(reg => reg.event_id === event_id);
};

export const searchRegistrationByPhone = async (db: any, event_id: string, phone: string) => {
  return registrations.filter(reg => 
    reg.event_id === event_id && reg.phone.includes(phone)
  );
};

export const getRegistrationById = async (db: any, registration_id: string) => {
  return registrations.find(reg => reg.id === registration_id);
};

export const checkInRegistration = async (db: any, registration_id: string, updateData?: { adults_count?: number; children_count?: number }) => {
  const index = registrations.findIndex(reg => reg.id === registration_id);
  if (index !== -1) {
    registrations[index] = { 
      ...registrations[index], 
      ...updateData,
      checked_in: true,
      checked_in_at: new Date().toISOString() 
    };
    return registrations[index];
  }
  return null;
};

export const getEventStats = async (db: any, event_id: string) => {
  const eventRegistrations = registrations.filter(reg => reg.event_id === event_id);
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
  const id = uuidv4();
  const organizer = { 
    id, 
    clerk_user_id: clerkUserId,
    email, 
    created_at: new Date().toISOString() 
  };
  organizers.push(organizer);
  return organizer;
};

export const getOrganizerByClerkId = async (db: any, clerkUserId: string) => {
  return organizers.find(org => org.clerk_user_id === clerkUserId);
};
