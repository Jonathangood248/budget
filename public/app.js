// =====================================================
// APP.JS - Frontend JavaScript Logic
// =====================================================
// This file handles all user interactions and communication with the backend.
//
// BEGINNER EXPLANATION:
// Think of this as the "brain" of your web page.
// - HTML = skeleton (structure)
// - CSS = appearance (styling)
// - JavaScript = brain (behavior, interactivity)
//
// This file:
// 1. Fetches data from the API (backend)
// 2. Displays data on the page
// 3. Handles user actions (add, edit, delete)
// 4. Updates the page without reloading

// =====================================================
// GLOBAL STATE
// =====================================================
// Store the current purchases in memory for easy access

let purchases = [];

// WHAT IS A GLOBAL VARIABLE?
// A variable declared outside any function that can be accessed anywhere.
// Think of it as a whiteboard everyone in the room can see and write on.

// =====================================================
// INITIALIZE APP WHEN PAGE LOADS
// =====================================================

// Wait for the HTML to fully load before running JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Pärt-Anton app initialized');

  // Fetch purchases and totals when page loads
  fetchPurchases();
  fetchTotals();

  // Set up the "Add Purchase" form
  setupAddPurchaseForm();
});

// WHAT IS DOMContentLoaded?
// "DOM" = Document Object Model (the HTML structure in memory)
// "DOMContentLoaded" = event that fires when HTML is fully loaded
// Like waiting for a house to be built before moving in furniture

// =====================================================
// FETCH PURCHASES FROM API
// =====================================================

async function fetchPurchases() {
  try {
    // Show loading state
    showLoading();

    // Make a GET request to the API
    const response = await fetch('/api/purchases');

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Convert response to JSON (JavaScript object)
    const data = await response.json();

    // Store purchases in global state
    purchases = data;

    // Display purchases on the page
    renderPurchases(purchases);

    console.log(`✅ Loaded ${purchases.length} purchases`);
  } catch (error) {
    console.error('❌ Error fetching purchases:', error);
    showError();
  }
}

// WHAT IS async/await?
// JavaScript operations like fetching data take time.
// async/await lets us wait for operations to complete.
//
// Without async/await (callback hell):
// fetch('/api/purchases')
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error(error));
//
// With async/await (cleaner, easier to read):
// const response = await fetch('/api/purchases');
// const data = await response.json();
//
// "await" = wait for this to finish before continuing
// "async" = marks the function as asynchronous

// WHAT IS fetch()?
// fetch() is a browser function that makes HTTP requests.
// Think of it like making a phone call to the server:
// You: "Can I have the purchases list?"
// Server: "Sure, here's the data!"

// =====================================================
// FETCH TOTALS FROM API
// =====================================================

async function fetchTotals() {
  try {
    const response = await fetch('/api/totals');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const totals = await response.json();

    // Update both top and bottom totals
    renderTotals(totals);

    console.log('✅ Totals updated:', totals);
  } catch (error) {
    console.error('❌ Error fetching totals:', error);
  }
}

// =====================================================
// RENDER PURCHASES (DISPLAY IN TABLE)
// =====================================================

function renderPurchases(purchasesList) {
  // Get the table body element
  const tbody = document.getElementById('purchases-tbody');

  // Get state containers
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const emptyState = document.getElementById('empty-state');
  const tableContainer = document.getElementById('table-container');

  // Hide loading, error states
  loading.style.display = 'none';
  errorDiv.style.display = 'none';

  // Check if there are no purchases
  if (purchasesList.length === 0) {
    emptyState.style.display = 'block';
    tableContainer.style.display = 'none';
    return;
  }

  // Show table, hide empty state
  emptyState.style.display = 'none';
  tableContainer.style.display = 'block';

  // Clear existing table rows
  tbody.innerHTML = '';

  // Loop through each purchase and create a table row
  purchasesList.forEach(purchase => {
    const row = createPurchaseRow(purchase);
    tbody.appendChild(row);
  });
}

// WHAT IS innerHTML?
// innerHTML = the HTML content inside an element
// Setting innerHTML = '' clears all content
// Like erasing everything on a whiteboard

// WHAT IS appendChild()?
// Adds a new element as a child of an existing element
// Like adding a new row to a table

// =====================================================
// CREATE PURCHASE ROW (TABLE ROW ELEMENT)
// =====================================================

function createPurchaseRow(purchase) {
  // Create a new table row element
  const tr = document.createElement('tr');

  // Set a data attribute to store the purchase ID
  tr.dataset.id = purchase.id;

  // Create table cells with inline editing capability
  tr.innerHTML = `
    <td class="editable" data-field="name">${escapeHtml(purchase.name)}</td>
    <td class="editable" data-field="link">
      ${purchase.link ? `<a href="${escapeHtml(purchase.link)}" target="_blank" class="product-link">View Link</a>` : '<span style="color: #999;">No link</span>'}
    </td>
    <td class="editable" data-field="cost">${formatCurrency(purchase.cost)}</td>
    <td>
      <label class="status-label">
        <input
          type="checkbox"
          class="status-checkbox"
          ${purchase.bought ? 'checked' : ''}
          data-id="${purchase.id}"
        >
        <span class="status-badge ${purchase.bought ? 'bought' : 'not-bought'}">
          ${purchase.bought ? '✓ Bought' : 'Not Yet'}
        </span>
      </label>
    </td>
    <td class="editable" data-field="comments">${escapeHtml(purchase.comments || '')}</td>
    <td>
      <button class="btn-delete" data-id="${purchase.id}">Delete</button>
    </td>
  `;

  // Add event listeners for inline editing
  const editableCells = tr.querySelectorAll('.editable');
  editableCells.forEach(cell => {
    cell.addEventListener('click', () => makeEditable(cell, purchase.id));
  });

  // Add event listener for status checkbox
  const statusCheckbox = tr.querySelector('.status-checkbox');
  statusCheckbox.addEventListener('change', (e) => {
    updatePurchaseStatus(purchase.id, e.target.checked);
  });

  // Add event listener for delete button
  const deleteBtn = tr.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => deletePurchase(purchase.id));

  return tr;
}

// WHAT IS createElement()?
// Creates a new HTML element in JavaScript
// const tr = document.createElement('tr') creates a <tr> element
// Like building a Lego piece before attaching it to the structure

// WHAT IS dataset?
// dataset lets you store custom data on HTML elements
// tr.dataset.id = 5 creates data-id="5" attribute
// Useful for linking DOM elements to data

// WHAT IS addEventListener()?
// Attaches a function to an event (like a click)
// element.addEventListener('click', functionToRun)
// When element is clicked, functionToRun executes

// =====================================================
// MAKE CELL EDITABLE (INLINE EDITING)
// =====================================================

function makeEditable(cell, purchaseId) {
  const field = cell.dataset.field;

  // Don't make link field editable (it has special handling)
  if (field === 'link') {
    return;
  }

  // Get current value
  const currentValue = cell.textContent.trim();

  // Create input field
  let input;
  if (field === 'comments') {
    input = document.createElement('textarea');
    input.rows = 2;
  } else if (field === 'cost') {
    input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.01';
    // Remove currency formatting for editing
    input.value = currentValue.replace(/[^\d.-]/g, '');
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
  }

  // Replace cell content with input
  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();

  // Save when Enter is pressed or when clicking outside
  const saveEdit = async () => {
    const newValue = input.value.trim();

    // Get the full purchase data
    const purchase = purchases.find(p => p.id === purchaseId);

    // Create updated purchase object
    const updatedData = {
      name: field === 'name' ? newValue : purchase.name,
      link: field === 'link' ? newValue : purchase.link,
      cost: field === 'cost' ? parseFloat(newValue) : purchase.cost,
      bought: purchase.bought,
      comments: field === 'comments' ? newValue : purchase.comments
    };

    // Update via API
    await updatePurchase(purchaseId, updatedData);
  };

  // Save on Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
  });

  // Save on blur (clicking outside)
  input.addEventListener('blur', saveEdit);
}

// INLINE EDITING FLOW:
// 1. User clicks on a cell → makeEditable() is called
// 2. Cell content is replaced with an input field
// 3. User types new value
// 4. User presses Enter or clicks outside → saveEdit() is called
// 5. API request updates the database
// 6. Table refreshes with updated data

// =====================================================
// RENDER TOTALS (UPDATE COUNTERS)
// =====================================================

function renderTotals(totals) {
  // Update top totals
  document.getElementById('top-total-cost').textContent = formatCurrency(totals.totalCost);
  document.getElementById('top-purchased-count').textContent = `${totals.purchasedCount} / ${totals.totalCount}`;
  document.getElementById('top-unpurchased-cost').textContent = formatCurrency(totals.unpurchasedCost);

  // Update bottom totals (identical to top)
  document.getElementById('bottom-total-cost').textContent = formatCurrency(totals.totalCost);
  document.getElementById('bottom-purchased-count').textContent = `${totals.purchasedCount} / ${totals.totalCount}`;
  document.getElementById('bottom-unpurchased-cost').textContent = formatCurrency(totals.unpurchasedCost);
}

// WHAT IS textContent?
// textContent = the text inside an element (no HTML)
// element.textContent = 'Hello' sets the text to "Hello"

// =====================================================
// LINK EXTRACTION - NEW FEATURE
// =====================================================
// When user pastes a product link, automatically try to extract
// the product title and price

let extractionInProgress = false; // Prevent multiple simultaneous extractions

async function extractProductFromLink(url) {
  // Skip if URL is empty or extraction already in progress
  if (!url || extractionInProgress) {
    return;
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    showExtractionStatus('invalid-url', 'Please enter a valid URL');
    return;
  }

  // Set flag to prevent concurrent requests
  extractionInProgress = true;

  try {
    // Show loading state
    showExtractionStatus('loading', 'Extracting product info...');

    // Call the extraction API
    const response = await fetch('/api/extract-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (!response.ok) {
      // Extraction failed
      showExtractionStatus('error', result.error || 'Could not extract product info');
      extractionInProgress = false;
      return;
    }

    // Success! Extract the data
    const { data } = result;

    console.log('✅ Extraction successful:', data);

    // Auto-fill form fields if data was extracted
    if (data.title) {
      document.getElementById('new-name').value = data.title;
      console.log('✓ Filled product name:', data.title);
    }

    if (data.price) {
      document.getElementById('new-cost').value = data.price;
      console.log('✓ Filled product cost:', data.price);
    }

    // Show success message
    showExtractionStatus('success', `✓ Extracted: ${data.title || 'Product'}`);

    // Clear success message after 3 seconds
    setTimeout(() => {
      clearExtractionStatus();
    }, 3000);
  } catch (error) {
    console.error('❌ Extraction error:', error);
    showExtractionStatus('error', 'Could not reach website. Please fill in manually.');
  } finally {
    extractionInProgress = false;
  }
}

// WHAT IS extractionInProgress?
// It's a flag (true/false) that prevents the function from running multiple times
// If user pastes link, function starts, and they paste again before it finishes,
// this flag prevents the second request from starting

// Validate URL format
function isValidUrl(string) {
  try {
    // Try to create a URL object - throws error if invalid
    new URL(string.startsWith('http') ? string : 'https://' + string);
    return true;
  } catch (e) {
    return false;
  }
}

// Show extraction status message
function showExtractionStatus(type, message) {
  const statusEl = document.getElementById('extraction-status');

  // Clear previous classes
  statusEl.className = 'extraction-status';

  // Set content and class based on type
  switch (type) {
    case 'loading':
      statusEl.innerHTML = `<span class="extraction-spinner"></span>${message}`;
      statusEl.classList.add('extraction-loading');
      break;
    case 'success':
      statusEl.innerHTML = `<span class="extraction-icon">✓</span>${message}`;
      statusEl.classList.add('extraction-success');
      break;
    case 'error':
      statusEl.innerHTML = `<span class="extraction-icon">✕</span>${message}`;
      statusEl.classList.add('extraction-error');
      break;
    case 'invalid-url':
      statusEl.innerHTML = `<span class="extraction-icon">⚠</span>${message}`;
      statusEl.classList.add('extraction-error');
      break;
  }

  statusEl.style.display = 'block';
}

// Clear extraction status
function clearExtractionStatus() {
  const statusEl = document.getElementById('extraction-status');
  statusEl.style.display = 'none';
}

// =====================================================
// ADD PURCHASE FORM SETUP
// =====================================================

function setupAddPurchaseForm() {
  const form = document.getElementById('add-purchase-form');
  const linkInput = document.getElementById('new-link');

  // Set up link extraction on change (when user finishes typing/pasting)
  linkInput.addEventListener('change', (e) => {
    const url = e.target.value.trim();
    if (url) {
      extractProductFromLink(url);
    } else {
      clearExtractionStatus();
    }
  });

  form.addEventListener('submit', async (e) => {
    // Prevent default form submission (which would reload the page)
    e.preventDefault();

    // Get form values
    const name = document.getElementById('new-name').value.trim();
    const link = document.getElementById('new-link').value.trim();
    const cost = parseFloat(document.getElementById('new-cost').value);
    const bought = document.getElementById('new-bought').checked;
    const comments = document.getElementById('new-comments').value.trim();

    // Validate
    if (!name) {
      alert('Please enter a product name');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      alert('Please enter a valid cost');
      return;
    }

    // Create purchase object
    const newPurchase = { name, link, cost, bought, comments };

    // Add via API
    await addPurchase(newPurchase);

    // Clear form
    form.reset();
  });
}

// WHAT IS preventDefault()?
// Forms normally submit and reload the page.
// e.preventDefault() stops that default behavior.
// We want to handle the submission ourselves with JavaScript.

// WHAT IS .checked?
// For checkboxes, .checked returns true/false (whether it's checked)
// For text inputs, we use .value

// =====================================================
// API FUNCTIONS (CREATE, UPDATE, DELETE)
// =====================================================

// Add new purchase
async function addPurchase(purchaseData) {
  try {
    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newPurchase = await response.json();

    console.log('✅ Purchase added:', newPurchase);

    // Refresh the display
    await fetchPurchases();
    await fetchTotals();
  } catch (error) {
    console.error('❌ Error adding purchase:', error);
    alert('Failed to add purchase. Please try again.');
  }
}

// WHAT IS JSON.stringify()?
// Converts a JavaScript object to JSON string
// { name: "Sofa" } → '{"name":"Sofa"}'
// Needed because HTTP requests send text, not objects

// WHAT ARE HEADERS?
// Headers provide metadata about the request
// 'Content-Type': 'application/json' tells the server we're sending JSON

// Update existing purchase
async function updatePurchase(id, purchaseData) {
  try {
    const response = await fetch(`/api/purchases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Purchase updated');

    // Refresh the display
    await fetchPurchases();
    await fetchTotals();
  } catch (error) {
    console.error('❌ Error updating purchase:', error);
    alert('Failed to update purchase. Please try again.');
  }
}

// Update purchase status (bought checkbox)
async function updatePurchaseStatus(id, bought) {
  try {
    // Find the purchase in our local state
    const purchase = purchases.find(p => p.id === id);

    // Create updated purchase object
    const updatedData = {
      name: purchase.name,
      link: purchase.link,
      cost: purchase.cost,
      bought: bought ? 1 : 0,
      comments: purchase.comments
    };

    // Update via API
    await updatePurchase(id, updatedData);
  } catch (error) {
    console.error('❌ Error updating status:', error);
  }
}

// Delete purchase
async function deletePurchase(id) {
  // Confirm before deleting
  const confirmed = confirm('Are you sure you want to delete this purchase?');

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/purchases/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Purchase deleted');

    // Refresh the display
    await fetchPurchases();
    await fetchTotals();
  } catch (error) {
    console.error('❌ Error deleting purchase:', error);
    alert('Failed to delete purchase. Please try again.');
  }
}

// WHAT IS confirm()?
// Shows a dialog box with "OK" and "Cancel" buttons
// Returns true if OK clicked, false if Cancel
// Simple way to get user confirmation

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Format number as currency (SEK)
function formatCurrency(amount) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' SEK';
}

// WHAT IS Intl.NumberFormat?
// Built-in JavaScript formatter for numbers/currency
// 'sv-SE' = Swedish locale (formats numbers Swedish style)
// 12000 → "12 000 SEK" (with space as thousand separator)

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// WHAT IS XSS?
// Cross-Site Scripting = security vulnerability
// If user enters: <script>alert('hack')</script>
// Without escaping, it would run as code!
// escapeHtml converts < to &lt; (safe text, not code)

// Show loading state
function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('table-container').style.display = 'none';
}

// Show error state
function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('table-container').style.display = 'none';
}

// =====================================================
// HOW EVERYTHING FITS TOGETHER
// =====================================================
//
// 1. PAGE LOADS
//    - DOMContentLoaded event fires
//    - fetchPurchases() and fetchTotals() are called
//
// 2. FETCHING DATA
//    - fetch('/api/purchases') sends GET request to server
//    - Server (server.js) receives request
//    - Server calls db.getAllPurchases() (database.js)
//    - Database returns purchases from SQLite
//    - Server sends purchases back as JSON
//    - Frontend receives purchases
//
// 3. DISPLAYING DATA
//    - renderPurchases() creates table rows
//    - createPurchaseRow() builds each row with buttons/checkboxes
//    - renderTotals() updates the counter displays
//
// 4. USER ADDS PURCHASE
//    - User fills form and clicks "Add Purchase"
//    - setupAddPurchaseForm() handles submit event
//    - addPurchase() sends POST request to server
//    - Server adds purchase to database
//    - Frontend refreshes display
//
// 5. USER EDITS PURCHASE
//    - User clicks on a cell
//    - makeEditable() replaces cell with input field
//    - User types and presses Enter
//    - updatePurchase() sends PUT request to server
//    - Server updates database
//    - Frontend refreshes display
//
// 6. USER DELETES PURCHASE
//    - User clicks delete button
//    - Confirmation dialog appears
//    - If confirmed, deletePurchase() sends DELETE request
//    - Server removes from database
//    - Frontend refreshes display
//
// The cycle continues: User interacts → API request → Database update → Display refresh

console.log('📱 App.js loaded successfully');
