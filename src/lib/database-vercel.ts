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

export const getEvent = async (db: any, event_id: string) => {
  return events.find(event => event.id === event_id);
};

// Registration operations
export const createRegistration = async (db: any, registrationData: {
  event_id: string;
  name: string;
  phone: string;
  children_count: number;
}) => {
  const id = uuidv4();
  const registration = { 
    id, 
    ...registrationData, 
    checked_in: false,
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

export const checkInRegistration = async (db: any, registration_id: string) => {
  const regIndex = registrations.findIndex(reg => reg.id === registration_id);
  if (regIndex !== -1) {
    registrations[regIndex].checked_in = true;
    registrations[regIndex].checked_in_at = new Date().toISOString();
    return registrations[regIndex];
  }
  return null;
};

export const getEventStats = async (db: any, event_id: string) => {
  const eventRegistrations = registrations.filter(reg => reg.event_id === event_id);
  const total_registered = eventRegistrations.length;
  const total_checked_in = eventRegistrations.filter(reg => reg.checked_in).length;
  
  return { total_registered, total_checked_in };
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
