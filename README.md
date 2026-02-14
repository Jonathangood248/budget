# 🏠 Pärt-Anton House Move Budget & Planning Tool

A clean, intuitive budget tracking application for planning your house move. Built with Node.js, Express, SQLite, and vanilla JavaScript—no frameworks needed!

Perfect for couples planning a move over the next few months. Track what you need to buy, how much it costs, and what you've already purchased.

**Live Demo**: Running on `http://localhost:3001`

---

## ✨ Features

### Core Budget Tracking
- **📋 Purchase Planning**: Add products you need to buy for your move
- **💰 Real-time Budget Totals**: See total cost, purchased items, and remaining budget at a glance
- **✏️ Inline Editing**: Click any field to edit it directly in the table (like Excel/Google Sheets)
- **☑️ Purchase Status**: Toggle items as purchased to track spending
- **🔗 Product Links**: Store product links and click them to shop

### Smart Link Extraction (NEW!)
- **🔍 Automatic Product Detection**: Paste a product link and the app automatically extracts:
  - Product title/name
  - Product description
  - Price (when available)
- **⚡ Real-time Extraction**: Works instantly as you paste
- **💬 Clear Feedback**: Loading spinner, success message, or helpful error message
- **🌐 Works With**: IKEA, Amazon, Elgiganten, Webhallen, and most modern e-commerce sites

### Design & UX
- **🎨 Apple-Inspired Design**: Clean, minimal interface with lots of whitespace
- **📱 Responsive**: Works great on desktop, tablet, and mobile
- **⚙️ No Framework Bloat**: Pure HTML5, CSS3, and Vanilla JavaScript
- **🚀 Fast & Lightweight**: Minimal dependencies, instant load times

---

## 🚀 Quick Start

### Requirements
- Node.js 14+
- npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Jonathangood248/budget.git
cd budget
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open in browser**
```
http://localhost:3001
```

Done! 🎉 The app will create a SQLite database automatically.

---

## 📖 How to Use

### Adding a Purchase

1. Fill in the "Add New Purchase" form:
   - **Product Name** (required) - What you're buying
   - **Product Link** (optional) - URL to the product
   - **Cost** (required) - Price in SEK
   - **Comments** (optional) - Any notes

2. **Smart Link Extraction**:
   - Paste a product link into the "Product Link" field
   - The app will automatically try to extract the product name
   - A loading spinner shows while extraction is happening
   - On success: Name and cost fields auto-fill
   - On failure: A helpful error message appears

3. Click **"Add Purchase"** or press Enter

### Editing Purchases

- **Click any cell** to edit it inline
- Press **Enter** or click outside to save
- Changes are saved instantly to the database

### Marking Items as Purchased

- Check the **"Bought?"** checkbox
- Totals update automatically
- Purchased items reduce your remaining budget

### Deleting Purchases

- Click **"Delete"** button
- Confirm the deletion
- Purchase is removed from your budget

### Viewing Totals

- **Top of page**: Large, prominent total showing budget status
- **Bottom of page**: Smaller display of the same totals
- Updates in real-time as you add/edit/delete items

---

## 🏗️ Technical Architecture

### Technology Stack

**Backend**
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **SQLite** - File-based database (stored in `data/budget.db`)
- **better-sqlite3** - Fast SQLite driver for Node.js
- **Cheerio** - HTML parser for link extraction

**Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Apple-inspired design with responsive layout
- **Vanilla JavaScript** - No frameworks, pure DOM manipulation

**Build Tools**
- **npm** - Package manager

### Project Structure

```
budget/
├── server.js              # Express server & API routes
├── database.js            # SQLite database module
├── link-extractor.js      # Product info extraction utility
├── package.json           # Project dependencies
├── README.md              # This file
├── data/
│   └── budget.db          # SQLite database (auto-created)
└── public/
    ├── index.html         # Main dashboard page
    ├── app.js             # Frontend JavaScript logic
    └── style.css          # Apple-inspired styling
```

---

## 🔌 API Endpoints

All endpoints return JSON responses.

### Get Purchases
```
GET /api/purchases
```
Returns all purchases from the database.

**Response:**
```json
[
  {
    "id": 1,
    "name": "BILLY Bookcase",
    "link": "https://www.ikea.com/...",
    "cost": 399,
    "bought": 0,
    "comments": "White, 80cm",
    "created_at": "2026-02-14T10:30:00Z"
  }
]
```

### Get Budget Totals
```
GET /api/totals
```
Returns total cost, purchased count, and remaining budget.

**Response:**
```json
{
  "totalCost": 12000,
  "purchasedCount": 2,
  "totalCount": 3,
  "unpurchasedCost": 5000
}
```

### Add Purchase
```
POST /api/purchases
```
Creates a new purchase.

**Request:**
```json
{
  "name": "BILLY Bookcase",
  "link": "https://www.ikea.com/...",
  "cost": 399,
  "bought": 0,
  "comments": "White, 80cm"
}
```

### Update Purchase
```
PUT /api/purchases/:id
```
Updates an existing purchase.

**Request:** Same as POST

### Delete Purchase
```
DELETE /api/purchases/:id
```
Removes a purchase from the database.

### Extract Product Info from Link
```
POST /api/extract-link
```
Automatically extracts product title and price from a URL.

**Request:**
```json
{
  "url": "https://www.ikea.com/se/sv/p/billy-bokhylla-vit-s70153879/"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "title": "BILLY Bookcase",
    "price": 399,
    "description": "Bookcase with adjustable shelves..."
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Could not find product information on this page."
}
```

---

## 🗄️ Database Schema

### Purchases Table

```sql
CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  link TEXT,
  cost REAL NOT NULL,
  bought INTEGER DEFAULT 0,
  comments TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**Columns:**
- `id` - Unique purchase identifier
- `name` - Product name (required)
- `link` - Product URL (optional)
- `cost` - Price in SEK (required)
- `bought` - Purchase status (0 = not bought, 1 = bought)
- `comments` - Any notes or special info
- `created_at` - When the purchase was added

---

## 🔍 Link Extraction Details

### How It Works

The app uses a smart 3-step extraction strategy:

1. **Open Graph Meta Tags** (Preferred)
   - Looks for `og:title`, `og:price`, `og:description`
   - Works great with most modern e-commerce sites
   - Most reliable method

2. **JSON-LD Structured Data** (Fallback)
   - Parses structured data for search engines
   - Works with many retailers

3. **Basic HTML Meta Tags** (Last Resort)
   - Falls back to page `<title>` and description meta tags
   - Works when structured data isn't available

### Supported Sites

✅ **Works Great With:**
- IKEA.se
- Amazon.se / Amazon.com
- Elgiganten
- Webhallen
- Most modern e-commerce platforms

❌ **Won't Work With:**
- JavaScript-heavy sites (requires full page rendering)
- Sites that block scrapers
- Price in images (requires OCR)
- Auction sites with dynamic pricing

### Extraction Timeout

- **5 seconds** per extraction request
- If a website is slow or unresponsive, extraction gracefully fails with a helpful message
- User can always fill in the information manually

---

## 🎨 Design Principles

### Apple-Inspired Aesthetic
- **Color Palette**: Neutral whites, light grays, and subtle blues
- **Typography**: System fonts (SF Pro Display, Segoe UI)
- **Spacing**: Generous whitespace and padding
- **Interactions**: Smooth transitions and subtle feedback
- **Borders**: Minimal, light gray dividers

### Accessibility
- Clear visual hierarchy
- Large, readable fonts
- High contrast text
- Simple, intuitive navigation
- Works without JavaScript (graceful degradation)

---

## 🛠️ Development

### Project Structure Explanation

**server.js**
- Express app initialization
- All API route handlers
- Database initialization on startup
- Serves static files from `public/`

**database.js**
- SQLite database setup
- CRUD functions (Create, Read, Update, Delete)
- Calculation of totals
- Error handling

**link-extractor.js**
- URL fetching with timeout
- HTML parsing with Cheerio
- Multiple extraction strategies
- Error handling with user-friendly messages

**public/index.html**
- Semantic HTML structure
- Dashboard layout with totals
- Add purchase form
- Purchases table

**public/app.js**
- Frontend API communication
- DOM manipulation
- Event listeners
- Form validation
- Inline editing logic
- Link extraction UI

**public/style.css**
- CSS Grid layout
- Responsive design
- Animation keyframes
- Color variables
- Component styling

### Adding Features

To add a new feature:

1. **Backend**: Add route to `server.js` and database function to `database.js`
2. **Frontend**: Add HTML to `index.html`, JavaScript to `app.js`, styles to `style.css`
3. **Test**: Use browser DevTools or API testing tool (Postman, curl)
4. **Commit**: `git add .` → `git commit -m "Add feature description"`

---

## 📝 Future Enhancements

Planned features for future versions:

- 🏷️ **Categories**: Organize purchases by room (kitchen, bedroom, etc.)
- 🔍 **Filters & Search**: Find purchases by name or status
- 📊 **Charts**: Visualize spending by category
- 📥 **Import/Export**: CSV support for data backup
- 🌙 **Dark Mode**: Optional dark theme
- 📱 **Progressive Web App**: Install as app on mobile
- 🔔 **Notifications**: Remind you about unpurchased items
- 💬 **Shared Lists**: Invite family members to collaborate
- 🛒 **Shopping Cart**: Send purchases to shopping platforms

---

## 🐛 Troubleshooting

### App won't start
```bash
# Check Node.js is installed
node --version

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Try again
npm start
```

### Port 3001 already in use
```bash
# Kill process using port 3001 (Mac/Linux)
lsof -ti:3001 | xargs kill -9

# Or use a different port by editing server.js
const PORT = 3002; // Change this line
```

### Link extraction not working
- Make sure the website has Open Graph or JSON-LD meta tags
- Check browser console for errors (F12 → Console)
- Verify internet connection
- Some sites block automated requests (try a different site)

### Data not persisting
- Check that `data/budget.db` exists in the project folder
- Verify write permissions on the `data/` folder
- Restart the server

---

## 📄 License

This project is open source and available under the ISC License.

---

## 👨‍👩‍👧 Contributing

This is a personal project for planning a house move, but contributions are welcome!

Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share feedback

---

## 🙏 Acknowledgments

Built with ❤️ for Pärt-Anton's house move planning.

Thanks to:
- **Express** - Simple, powerful web server
- **SQLite** - Lightweight, reliable database
- **Cheerio** - Easy HTML parsing
- **Apple Design** - Inspiration for clean, minimal UI

---

## 📧 Questions?

If you have questions about how the app works or how to use it, check:
1. This README
2. Code comments (very beginner-friendly!)
3. GitHub Issues
4. Browser DevTools Console (F12)

---

**Happy moving! 🏡**
