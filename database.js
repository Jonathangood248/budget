// =====================================================
// DATABASE.JS - SQLite Database Setup & Functions
// =====================================================
// This file handles all database operations for the Pärt-Anton budget tracker.
// It uses SQLite (via better-sqlite3) - a simple file-based database.
//
// BEGINNER EXPLANATION:
// Think of this file as a librarian managing a filing cabinet (the database).
// The librarian knows how to:
// - Set up the filing cabinet (initDatabase)
// - Find all files (getAllPurchases)
// - Add new files (addPurchase)
// - Update existing files (updatePurchase)
// - Remove files (deletePurchase)
// - Count and calculate totals (getTotals)

const Database = require('better-sqlite3');
const path = require('path');

// =====================================================
// ROOM CATEGORIES
// =====================================================
// These are the rooms in the new house.
// Used by both the backend (validation) and frontend (dropdowns).

const ROOMS = [
  'Kitchen',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Living Room (Small)',
  'Living Room (Big)',
  'Dining Room',
  'Bathroom 1',
  'Bathroom 2'
];

// Connect to the database file (creates it if it doesn't exist)
// __dirname means "the folder this file is in"
// path.join combines folder paths in a way that works on Windows, Mac, and Linux
const dbPath = path.join(__dirname, 'data', 'budget.db');
const db = new Database(dbPath);

// WHAT IS SQLITE?
// SQLite is a lightweight database that stores all data in a single file (budget.db).
// Unlike MySQL or PostgreSQL, you don't need to install a separate database server.
// Perfect for small apps like this!

// =====================================================
// INITIALIZE DATABASE
// =====================================================
// This function creates the "purchases" table if it doesn't already exist.
// It's called when the server starts.

function initDatabase() {
  // SQL is the language used to talk to databases
  // CREATE TABLE IF NOT EXISTS = create the table only if it's not already there
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      link TEXT,
      cost REAL NOT NULL,
      bought INTEGER DEFAULT 0,
      comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Execute the SQL command
  db.prepare(createTableSQL).run();

  // MIGRATION: Add 'room' column if it doesn't exist
  // SQLite doesn't have IF NOT EXISTS for ALTER TABLE,
  // so we check the table info first using PRAGMA
  const columns = db.prepare("PRAGMA table_info(purchases)").all();
  const hasRoomColumn = columns.some(col => col.name === 'room');

  if (!hasRoomColumn) {
    db.prepare("ALTER TABLE purchases ADD COLUMN room TEXT DEFAULT ''").run();
    console.log('📐 Added "room" column to purchases table');
  }

  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${dbPath}`);
}

// FIELD EXPLANATIONS:
// - id: Unique number for each purchase (auto-increments: 1, 2, 3, ...)
// - name: Product name (TEXT = text/string, NOT NULL = required)
// - link: Product URL (TEXT, optional - can be empty)
// - cost: Price in SEK (REAL = number with decimals, NOT NULL = required)
// - bought: Purchase status (INTEGER: 0 = no, 1 = yes, DEFAULT 0 = starts as "no")
// - comments: Notes about the purchase (TEXT, optional)
// - created_at: When the purchase was added (TIMESTAMP = date and time, auto-set)

// =====================================================
// GET ALL PURCHASES
// =====================================================
// Returns an array of all purchases from the database

function getAllPurchases() {
  // SELECT * = get all columns
  // FROM purchases = from the "purchases" table
  // ORDER BY created_at DESC = newest first
  const stmt = db.prepare('SELECT * FROM purchases ORDER BY created_at DESC');
  return stmt.all();
}

// EXAMPLE RETURN VALUE:
// [
//   { id: 1, name: "Sofa", link: "https://ikea.com/sofa", cost: 5000, bought: 1, comments: "For living room" },
//   { id: 2, name: "Table", link: "", cost: 2000, bought: 0, comments: "" }
// ]

// =====================================================
// ADD NEW PURCHASE
// =====================================================
// Adds a new purchase to the database
// Parameters: name, link, cost, bought (0 or 1), comments

function addPurchase(name, link, cost, bought, comments, room) {
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new Error('Product name is required');
  }
  if (cost === undefined || cost === null) {
    throw new Error('Cost is required');
  }

  // Convert cost to number and validate
  const numericCost = parseFloat(cost);
  if (isNaN(numericCost) || numericCost < 0) {
    throw new Error('Cost must be a valid positive number');
  }

  // INSERT INTO = add new row to table
  // (name, link, cost, bought, comments, room) = columns we're filling
  // VALUES (?, ?, ?, ?, ?, ?) = placeholders for values (prevents SQL injection attacks)
  const stmt = db.prepare(`
    INSERT INTO purchases (name, link, cost, bought, comments, room)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name.trim(),
    link || '',
    numericCost,
    bought ? 1 : 0,
    comments || '',
    room || ''
  );

  // Return the newly created purchase (including its new ID)
  return {
    id: result.lastInsertRowid,
    name: name.trim(),
    link: link || '',
    cost: numericCost,
    bought: bought ? 1 : 0,
    comments: comments || '',
    room: room || ''
  };
}

// WHY USE PLACEHOLDERS (?)?
// Using ? prevents "SQL injection" attacks - a common security vulnerability.
// NEVER do: `INSERT INTO purchases VALUES ("${name}")` - this is dangerous!
// ALWAYS do: prepare with ? and pass values separately (like we do above)

// =====================================================
// UPDATE EXISTING PURCHASE
// =====================================================
// Updates a purchase by ID
// Parameters: id, name, link, cost, bought, comments

function updatePurchase(id, name, link, cost, bought, comments, room) {
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new Error('Product name is required');
  }
  if (cost === undefined || cost === null) {
    throw new Error('Cost is required');
  }

  // Convert cost to number and validate
  const numericCost = parseFloat(cost);
  if (isNaN(numericCost) || numericCost < 0) {
    throw new Error('Cost must be a valid positive number');
  }

  // UPDATE = modify existing row
  // SET = which columns to change
  // WHERE id = ? = only update the row with this specific ID
  const stmt = db.prepare(`
    UPDATE purchases
    SET name = ?, link = ?, cost = ?, bought = ?, comments = ?, room = ?
    WHERE id = ?
  `);

  const result = stmt.run(
    name.trim(),
    link || '',
    numericCost,
    bought ? 1 : 0,
    comments || '',
    room || '',
    id
  );

  // Check if the purchase was found and updated
  if (result.changes === 0) {
    throw new Error(`Purchase with ID ${id} not found`);
  }

  return {
    id,
    name: name.trim(),
    link: link || '',
    cost: numericCost,
    bought: bought ? 1 : 0,
    comments: comments || '',
    room: room || ''
  };
}

// =====================================================
// DELETE PURCHASE
// =====================================================
// Removes a purchase from the database by ID

function deletePurchase(id) {
  // DELETE FROM = remove row
  // WHERE id = ? = only delete the row with this specific ID
  const stmt = db.prepare('DELETE FROM purchases WHERE id = ?');
  const result = stmt.run(id);

  // Check if the purchase was found and deleted
  if (result.changes === 0) {
    throw new Error(`Purchase with ID ${id} not found`);
  }

  return { success: true, message: 'Purchase deleted successfully' };
}

// =====================================================
// GET TOTALS (CALCULATIONS)
// =====================================================
// Calculates budget totals for display

function getTotals() {
  // This SQL query does several calculations at once:
  // - COUNT(*) = count all purchases
  // - SUM(cost) = add up all costs
  // - SUM(CASE...) = conditional sum (only add costs where bought = 1)
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as totalCount,
      COALESCE(SUM(cost), 0) as totalCost,
      SUM(CASE WHEN bought = 1 THEN 1 ELSE 0 END) as purchasedCount,
      COALESCE(SUM(CASE WHEN bought = 1 THEN cost ELSE 0 END), 0) as purchasedCost,
      COALESCE(SUM(CASE WHEN bought = 0 THEN cost ELSE 0 END), 0) as unpurchasedCost
    FROM purchases
  `);

  const totals = stmt.get();

  return {
    totalCount: totals.totalCount || 0,
    totalCost: totals.totalCost || 0,
    purchasedCount: totals.purchasedCount || 0,
    purchasedCost: totals.purchasedCost || 0,
    unpurchasedCost: totals.unpurchasedCost || 0
  };
}

// COALESCE EXPLAINED:
// COALESCE(value, 0) means "use 'value' if it exists, otherwise use 0"
// This prevents errors when the database is empty

// CASE WHEN EXPLAINED:
// CASE WHEN bought = 1 THEN cost ELSE 0 END means:
// "If bought is 1, use the cost, otherwise use 0"
// It's like an if-statement inside SQL

// EXAMPLE RETURN VALUE:
// {
//   totalCount: 5,           // 5 total purchases
//   totalCost: 12000,        // 12,000 SEK total
//   purchasedCount: 2,       // 2 items bought
//   purchasedCost: 7000,     // 7,000 SEK spent
//   unpurchasedCost: 5000    // 5,000 SEK remaining to buy
// }

// =====================================================
// EXPORT FUNCTIONS
// =====================================================
// This makes all our functions available to other files (like server.js)

module.exports = {
  initDatabase,
  getAllPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  getTotals,
  ROOMS
};

// HOW TO USE THIS FILE:
// In server.js, we'll do: const db = require('./database.js');
// Then we can call: db.getAllPurchases(), db.addPurchase(...), etc.
