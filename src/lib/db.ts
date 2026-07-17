import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { CATEGORIES } from "./categories";
import { placeholderImage } from "./placeholder";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tagline TEXT NOT NULL,
    bio TEXT NOT NULL,
    price INTEGER NOT NULL,
    location TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 4.8,
    reviewCount INTEGER NOT NULL DEFAULT 0,
    avatarEmoji TEXT NOT NULL,
    portfolio TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    providerId INTEGER NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'paid',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (providerId) REFERENCES providers(id)
  );
`);

export type Provider = {
  id: number;
  name: string;
  category: string;
  tagline: string;
  bio: string;
  price: number;
  location: string;
  rating: number;
  reviewCount: number;
  avatarEmoji: string;
  portfolio: string[];
  createdAt: string;
};

type ProviderRow = Omit<Provider, "portfolio"> & { portfolio: string };

function rowToProvider(row: ProviderRow): Provider {
  return { ...row, portfolio: JSON.parse(row.portfolio) };
}

export function getAllProviders(): Provider[] {
  const rows = db
    .prepare("SELECT * FROM providers ORDER BY rating DESC, id DESC")
    .all() as ProviderRow[];
  return rows.map(rowToProvider);
}

export function getProvidersByCategory(category: string): Provider[] {
  const rows = db
    .prepare("SELECT * FROM providers WHERE category = ? ORDER BY rating DESC, id DESC")
    .all(category) as ProviderRow[];
  return rows.map(rowToProvider);
}

export function getProviderById(id: number): Provider | undefined {
  const row = db.prepare("SELECT * FROM providers WHERE id = ?").get(id) as
    | ProviderRow
    | undefined;
  return row ? rowToProvider(row) : undefined;
}

export function createProvider(input: {
  name: string;
  category: string;
  tagline: string;
  bio: string;
  price: number;
  location: string;
  avatarEmoji: string;
  portfolio: string[];
}): number {
  const stmt = db.prepare(`
    INSERT INTO providers (name, category, tagline, bio, price, location, avatarEmoji, portfolio)
    VALUES (@name, @category, @tagline, @bio, @price, @location, @avatarEmoji, @portfolio)
  `);
  const result = stmt.run({ ...input, portfolio: JSON.stringify(input.portfolio) });
  return Number(result.lastInsertRowid);
}

export type Booking = {
  id: number;
  providerId: number;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  note: string | null;
  status: string;
  createdAt: string;
};

export function createBooking(input: {
  providerId: number;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  note?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO bookings (providerId, customerName, customerPhone, date, time, note, status)
    VALUES (@providerId, @customerName, @customerPhone, @date, @time, @note, 'paid')
  `);
  const result = stmt.run({ ...input, note: input.note ?? null });
  return Number(result.lastInsertRowid);
}

export function getBookingById(id: number): Booking | undefined {
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking | undefined;
}

export function isSlotTaken(providerId: number, date: string, time: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM bookings WHERE providerId = ? AND date = ? AND time = ?")
    .get(providerId, date, time);
  return !!row;
}

function seed() {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM providers").get() as { c: number }).c;
  if (count > 0) return;

  const samples = [
    {
      name: "Coach Amir",
      category: "coach",
      tagline: "Personal fitness & strength coaching",
      bio: "10 years helping beginners get fit, safely and without burnout. First session includes a full assessment.",
      price: 25,
      location: "Downtown Gym",
      avatarEmoji: "🏋️",
      photoCount: 3,
    },
    {
      name: "Coach Lina",
      category: "coach",
      tagline: "Yoga & mobility coach",
      bio: "Certified yoga instructor focused on flexibility, posture, and stress relief.",
      price: 20,
      location: "Riverside Studio",
      avatarEmoji: "🧘",
      photoCount: 2,
    },
    {
      name: "Karim's Barbershop",
      category: "barber",
      tagline: "Sharp fades, classic cuts",
      bio: "15 years cutting hair. Specializes in fades, beard shaping, and kids' cuts.",
      price: 8,
      location: "Main Street",
      avatarEmoji: "💈",
      photoCount: 3,
    },
    {
      name: "Yusuf the Barber",
      category: "barber",
      tagline: "Modern styles, walk-ins welcome",
      bio: "Trained in Turkey, brings the full hot-towel shave experience.",
      price: 10,
      location: "Old Town",
      avatarEmoji: "✂️",
      photoCount: 2,
    },
    {
      name: "Hassan Painting Co. (دهان)",
      category: "painter",
      tagline: "Interior & exterior painting",
      bio: "We paint homes, apartments, and offices. Clean work, fair prices, free color consultation.",
      price: 150,
      location: "City-wide",
      avatarEmoji: "🎨",
      photoCount: 3,
    },
    {
      name: "Omar's Plumbing (سباكة)",
      category: "plumber",
      tagline: "Leaks, installs, emergencies",
      bio: "Licensed plumber, available for emergencies. Fixes leaks, installs sinks/heaters, unblocks drains.",
      price: 40,
      location: "City-wide",
      avatarEmoji: "🔧",
      photoCount: 2,
    },
    {
      name: "Bilal Auto Tint (تضليل)",
      category: "tinting",
      tagline: "Car window tinting specialist",
      bio: "Premium ceramic and carbon tint film. Lifetime warranty on all installs.",
      price: 90,
      location: "Auto District",
      avatarEmoji: "🚗",
      photoCount: 3,
    },
    {
      name: "Sami Electric (كهربائي)",
      category: "electrician",
      tagline: "Wiring, fixtures, safety checks",
      bio: "Certified electrician for homes and small businesses. Fast response, upfront pricing.",
      price: 45,
      location: "City-wide",
      avatarEmoji: "💡",
      photoCount: 2,
    },
    {
      name: "Sparkle Cleaning (تنظيف)",
      category: "cleaning",
      tagline: "Home & office deep cleaning",
      bio: "Trusted, insured cleaning team. Bring our own supplies. Satisfaction guaranteed.",
      price: 30,
      location: "City-wide",
      avatarEmoji: "🧹",
      photoCount: 2,
    },
    {
      name: "CoolFix AC (فني تكييف)",
      category: "ac",
      tagline: "AC repair & maintenance",
      bio: "Fast, reliable AC servicing. Gas refill, deep cleaning, and full repairs.",
      price: 35,
      location: "City-wide",
      avatarEmoji: "❄️",
      photoCount: 2,
    },
  ].map((item) => ({
    ...item,
    portfolio: Array.from({ length: item.photoCount }, (_, i) =>
      placeholderImage(`${item.name}#${i}`, item.avatarEmoji),
    ),
  }));

  const insert = db.prepare(`
    INSERT INTO providers (name, category, tagline, bio, price, location, rating, reviewCount, avatarEmoji, portfolio)
    VALUES (@name, @category, @tagline, @bio, @price, @location, @rating, @reviewCount, @avatarEmoji, @portfolio)
  `);

  const insertMany = db.transaction((items: typeof samples) => {
    for (const item of items) {
      insert.run({
        ...item,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: 5 + Math.floor(Math.random() * 120),
        portfolio: JSON.stringify(item.portfolio),
      });
    }
  });

  insertMany(samples);
}

seed();

export { CATEGORIES };
export default db;
