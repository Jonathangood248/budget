// =====================================================
// SERVER.JS - Express Web Server & API Routes
// =====================================================
// This file creates a web server that:
// 1. Serves your HTML/CSS/JS files (the frontend)
// 2. Provides API endpoints for the frontend to interact with the database
//
// BEGINNER EXPLANATION:
// Think of this as a restaurant:
// - Express is the restaurant building
// - API routes are the menu items you can order
// - The database is the kitchen where food (data) is stored
// - Your browser (frontend) is the customer ordering from the menu

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const linkExtractor = require('./link-extractor');

// =====================================================
// INITIALIZE EXPRESS APP
// =====================================================

const app = express();
const PORT = 3001; // The port number where the server will listen

// WHAT IS EXPRESS?
// Express is a framework that makes it easy to build web servers in Node.js.
// Without Express, you'd have to write a lot of complex code to handle HTTP requests.
// Express simplifies this into a few lines!

// =====================================================
// MIDDLEWARE SETUP
// =====================================================
// Middleware are like preprocessors that run before your route handlers.
// Think of them as security guards or helpers at the restaurant entrance.

// 1. CORS - Allows the frontend to make requests to the backend
// (Cross-Origin Resource Sharing - needed when frontend and backend communicate)
app.use(cors());

// 2. JSON Parser - Automatically converts incoming JSON data to JavaScript objects
// When the frontend sends { "name": "Sofa", "cost": 5000 }, this converts it to a JS object
app.use(express.json());

// 3. Static Files - Serves HTML, CSS, JS files from the "public" folder
// When you visit http://localhost:3001, it serves public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// WHAT IS MIDDLEWARE?
// Middleware functions run in order before your route handlers.
// Think of it like an assembly line:
// Request → CORS → JSON Parser → Static Files → Your Route Handler → Response

// =====================================================
// INITIALIZE DATABASE
// =====================================================
// Create the database table when the server starts

db.initDatabase();

// =====================================================
// API ROUTES
// =====================================================
// These are the "menu items" that the frontend can order from.
// Each route handles a specific action: GET (fetch), POST (create), PUT (update), DELETE (remove)

// WHAT IS REST?
// REST is a pattern for designing APIs:
// - GET = Fetch/Read data
// - POST = Create new data
// - PUT = Update existing data
// - DELETE = Remove data

// -----------------------------------------------------
// GET /api/purchases - Fetch all purchases
// -----------------------------------------------------
// Example: Frontend calls fetch('/api/purchases')
// This returns an array of all purchases from the database

app.get('/api/purchases', (req, res) => {
  try {
    const purchases = db.getAllPurchases();
    res.json(purchases); // Send purchases as JSON
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// EXPLANATION:
// - app.get() = handle GET requests
// - '/api/purchases' = the URL path
// - (req, res) => {} = function that runs when this route is called
//   - req = request object (contains data sent from frontend)
//   - res = response object (used to send data back to frontend)
// - res.json() = send data as JSON format
// - res.status(500) = HTTP status code (500 = server error)

// -----------------------------------------------------
// GET /api/totals - Get budget totals
// -----------------------------------------------------
// Example: Frontend calls fetch('/api/totals')
// Returns: { totalCost: 12000, purchasedCount: 2, unpurchasedCost: 5000 }

app.get('/api/totals', (req, res) => {
  try {
    const totals = db.getTotals();
    res.json(totals);
  } catch (error) {
    console.error('Error calculating totals:', error);
    res.status(500).json({ error: 'Failed to calculate totals' });
  }
});

// -----------------------------------------------------
// POST /api/purchases - Add new purchase
// -----------------------------------------------------
// Example: Frontend sends { name: "Sofa", cost: 5000, bought: 0, ... }
// This creates a new purchase in the database

app.post('/api/purchases', (req, res) => {
  try {
    // Extract data from request body (including room category)
    const { name, link, cost, bought, comments, room } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (cost === undefined || cost === null || cost === '') {
      return res.status(400).json({ error: 'Cost is required' });
    }

    // Add the purchase to the database
    const newPurchase = db.addPurchase(name, link, cost, bought, comments, room);

    // Send back the newly created purchase (including its ID)
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to add purchase' });
  }
});

// HTTP STATUS CODES EXPLAINED:
// - 200 = OK (success)
// - 201 = Created (new resource created successfully)
// - 400 = Bad Request (client sent invalid data)
// - 500 = Server Error (something went wrong on the server)

// WHAT IS req.body?
// When the frontend sends data in a POST/PUT request, it's in req.body.
// The express.json() middleware (set up earlier) converts it to a JS object.

// -----------------------------------------------------
// PUT /api/purchases/:id - Update existing purchase
// -----------------------------------------------------
// Example: Frontend sends PUT to /api/purchases/3 with updated data
// This updates the purchase with ID 3

app.put('/api/purchases/:id', (req, res) => {
  try {
    // Get the ID from the URL (the ":id" part)
    const id = parseInt(req.params.id);

    // Extract updated data from request body (including room category)
    const { name, link, cost, bought, comments, room } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (cost === undefined || cost === null || cost === '') {
      return res.status(400).json({ error: 'Cost is required' });
    }

    // Update the purchase in the database
    const updatedPurchase = db.updatePurchase(id, name, link, cost, bought, comments, room);

    // Send back the updated purchase
    res.json(updatedPurchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to update purchase' });
  }
});

// WHAT IS :id?
// :id is a URL parameter - a placeholder for a value.
// If the URL is /api/purchases/5, then req.params.id = "5"
// We use parseInt() to convert the string "5" to the number 5

// -----------------------------------------------------
// DELETE /api/purchases/:id - Delete purchase
// -----------------------------------------------------
// Example: Frontend sends DELETE to /api/purchases/3
// This removes the purchase with ID 3

app.delete('/api/purchases/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Delete the purchase from the database
    const result = db.deletePurchase(id);

    res.json(result);
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to delete purchase' });
  }
});

// =====================================================
// POST /api/extract-link - Extract product info from URL
// =====================================================
// NEW FEATURE: Automatically extract product title, price, and description
// from a provided URL.
//
// This endpoint takes a URL (from a product link), fetches the webpage,
// and extracts product information using multiple strategies:
// 1. Open Graph meta tags (og:title, og:price, og:description)
// 2. JSON-LD structured data
// 3. Basic HTML meta tags
// 4. Price patterns in page text
//
// Example request:
// POST /api/extract-link
// { "url": "https://www.ikea.com/se/sv/p/billy/..." }
//
// Example response (success):
// { "title": "BILLY Bookcase", "price": 399, "description": "..." }
//
// Example response (error):
// { "error": "Could not find product information on this page." }

app.post('/api/extract-link', async (req, res) => {
  try {
    // Get the URL from the request body
    const { url } = req.body;

    // Validate that URL is provided
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Add protocol if missing (helps with URL parsing)
    let urlToFetch = url.trim();
    if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
      urlToFetch = 'https://' + urlToFetch;
    }

    console.log(`📥 Extraction request for: ${urlToFetch}`);

    // Call the extraction utility
    const extractedData = await linkExtractor.extractProductInfo(urlToFetch);

    // Return the extracted data
    res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('❌ Extraction error:', error.message);

    // Return user-friendly error message
    res.status(400).json({
      success: false,
      error: error.message || 'Could not extract product information. Please fill in manually.'
    });
  }
});

// =====================================================
// START THE SERVER
// =====================================================
// This starts the server and makes it listen for requests

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   🏠 Pärt-Anton Budget Tracker Server Started    ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${path.join(__dirname, 'public')}`);
  console.log(`💾 Database location: ${path.join(__dirname, 'data', 'budget.db')}`);
  console.log('');
  console.log('📋 Available API endpoints:');
  console.log('   GET    /api/purchases      - Fetch all purchases');
  console.log('   GET    /api/totals         - Get budget totals');
  console.log('   POST   /api/purchases      - Add new purchase');
  console.log('   PUT    /api/purchases/:id  - Update purchase');
  console.log('   DELETE /api/purchases/:id  - Delete purchase');
  console.log('   POST   /api/extract-link   - Extract product info from URL');
  console.log('');
  console.log('🌐 Open your browser and visit: http://localhost:3001');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// WHAT HAPPENS WHEN YOU VISIT http://localhost:3001?
// 1. Your browser sends a GET request to http://localhost:3001
// 2. Express receives the request
// 3. The static files middleware sees you want "/" (the root)
// 4. It serves public/index.html
// 5. The browser loads index.html, which loads style.css and app.js
// 6. app.js makes API requests to /api/purchases and /api/totals
// 7. Express routes those requests to the appropriate handlers above
// 8. The handlers fetch data from the database and send it back
// 9. app.js receives the data and updates the page

// =====================================================
// ERROR HANDLING
// =====================================================
// Catch-all for undefined routes (404 errors)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ANALOGY RECAP:
// Server = Restaurant
// Express = Restaurant building/framework
// Routes = Menu items (GET, POST, PUT, DELETE)
// Database = Kitchen (where data is stored)
// Frontend = Customer ordering from the menu
// API = The waiter who takes orders and brings food
