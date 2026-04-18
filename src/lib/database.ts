import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const dbPath = './event-checkin.db';

// Database setup
export const initDB = () => {
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    // Events table
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        organizer_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Registrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        children_count INTEGER DEFAULT 0,
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id)
      )
    `);

    // Organizers table
    db.run(`
      CREATE TABLE IF NOT EXISTS organizers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  return db;
};

// Helper function to run queries with promises
export const runQuery = (db: sqlite3.Database, query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (db: sqlite3.Database, query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getSingle = (db: sqlite3.Database, query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Event operations
export const createEvent = async (db: sqlite3.Database, eventData: {
  name: string;
  date: string;
  organizer_id: string;
}) => {
  const id = uuidv4();
  await runQuery(db, 
    'INSERT INTO events (id, name, date, organizer_id) VALUES (?, ?, ?, ?)',
    [id, eventData.name, eventData.date, eventData.organizer_id]
  );
  return { id, ...eventData };
};

export const getEvents = async (db: sqlite3.Database, organizer_id: string) => {
  return getQuery(db, 'SELECT * FROM events WHERE organizer_id = ? ORDER BY date DESC', [organizer_id]);
};

export const getEvent = async (db: sqlite3.Database, event_id: string) => {
  return getSingle(db, 'SELECT * FROM events WHERE id = ?', [event_id]);
};

// Registration operations
export const createRegistration = async (db: sqlite3.Database, registrationData: {
  event_id: string;
  name: string;
  phone: string;
  children_count: number;
}) => {
  const id = uuidv4();
  await runQuery(db,
    'INSERT INTO registrations (id, event_id, name, phone, children_count) VALUES (?, ?, ?, ?, ?)',
    [id, registrationData.event_id, registrationData.name, registrationData.phone, registrationData.children_count]
  );
  return { id, ...registrationData };
};

export const getRegistrations = async (db: sqlite3.Database, event_id: string) => {
  return getQuery(db, 'SELECT * FROM registrations WHERE event_id = ? ORDER BY created_at DESC', [event_id]);
};

export const searchRegistrationByPhone = async (db: sqlite3.Database, event_id: string, phone: string) => {
  return getQuery(db, 'SELECT * FROM registrations WHERE event_id = ? AND phone LIKE ? ORDER BY name', 
    [event_id, `%${phone}%`]);
};

export const getRegistrationById = async (db: sqlite3.Database, registration_id: string) => {
  return getSingle(db, 'SELECT * FROM registrations WHERE id = ?', [registration_id]);
};

export const checkInRegistration = async (db: sqlite3.Database, registration_id: string) => {
  await runQuery(db,
    'UPDATE registrations SET checked_in = TRUE, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?',
    [registration_id]
  );
  return getRegistrationById(db, registration_id);
};

export const getEventStats = async (db: sqlite3.Database, event_id: string) => {
  const stats = await getSingle(db, 
    'SELECT COUNT(*) as total_registered, SUM(CASE WHEN checked_in = TRUE THEN 1 ELSE 0 END) as total_checked_in FROM registrations WHERE event_id = ?',
    [event_id]
  );
  return stats;
};

// Organizer operations
export const createOrganizer = async (db: sqlite3.Database, email: string) => {
  const id = uuidv4();
  await runQuery(db, 'INSERT INTO organizers (id, email) VALUES (?, ?)', [id, email]);
  return { id, email };
};

export const getOrganizerByEmail = async (db: sqlite3.Database, email: string) => {
  return getSingle(db, 'SELECT * FROM organizers WHERE email = ?', [email]);
};
