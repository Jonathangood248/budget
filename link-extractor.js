// =====================================================
// LINK-EXTRACTOR.JS - Extract Product Info from URLs
// =====================================================
// This utility fetches a webpage and extracts product information
// (title, price, description) using multiple strategies.
//
// BEGINNER EXPLANATION:
// This is like a web robot that:
// 1. Visits a URL (like IKEA.com)
// 2. Reads the HTML code
// 3. Looks for product info (price, name, description)
// 4. Extracts what it finds and returns it
//
// It tries multiple strategies because different websites
// store information in different places.

const cheerio = require('cheerio');

// WHAT IS CHEERIO?
// Cheerio is a JavaScript library for parsing HTML.
// It's like jQuery (JavaScript DOM manipulation library)
// but works on the server side instead of in the browser.
//
// It lets us:
// - Load HTML as a string
// - Search for elements by CSS selectors
// - Extract text and attributes
// Example: $('meta[property="og:price"]').attr('content')

// =====================================================
// FETCH URL WITH TIMEOUT
// =====================================================

async function fetchUrl(url, timeout = 5000) {
  try {
    // Validate URL format first
    try {
      new URL(url); // Throws error if URL is invalid
    } catch (e) {
      throw new Error('Invalid URL format. Please enter a valid URL.');
    }

    // Set up fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Many websites block requests without a User-Agent
        // This header makes the request look like it comes from a real browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Website returned error: ${response.status}`);
    }

    // Get HTML text
    const html = await response.text();
    return html;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Website took too long to respond.');
    }
    throw error;
  }
}

// WHAT IS TIMEOUT?
// A timeout is a time limit for an operation.
// If it takes longer than 5 seconds, we stop waiting.
// This prevents the app from hanging forever if a website is slow.

// WHAT IS User-Agent?
// User-Agent tells websites who is making the request.
// Without it, some websites think you're a bot and block you.
// With it, they think you're a real browser.

// =====================================================
// EXTRACT OPEN GRAPH META TAGS
// =====================================================
// Many modern websites use Open Graph tags for sharing on social media
// These tags are perfect for extracting product info!

function extractOpenGraph($) {
  const data = {};

  // Open Graph meta tags look like:
  // <meta property="og:title" content="Product Name">
  // <meta property="og:price" content="999">
  // <meta property="og:description" content="...">

  const title = $('meta[property="og:title"]').attr('content');
  const price = $('meta[property="og:price"]').attr('content');
  const description = $('meta[property="og:description"]').attr('content');
  const image = $('meta[property="og:image"]').attr('content');

  // CSS SELECTORS EXPLAINED:
  // meta[property="og:title"] = find <meta> tags where property attribute = "og:title"
  // .attr('content') = get the content attribute value

  if (title) data.title = title.trim();
  if (price) {
    // Try to extract just the number from the price
    const priceMatch = price.match(/[\d,.\s]+/);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[0].replace(/[,\s]/g, '.'));
    }
  }
  if (description) data.description = description.trim();
  if (image) data.image = image.trim();

  return Object.keys(data).length > 0 ? data : null;
}

// WHAT IS REGEX (Regular Expressions)?
// Regex is a pattern for matching text.
// /[\d,.\s]+/ means: one or more digits, commas, dots, or spaces
// This extracts numbers from strings like "999,50 SEK"

// =====================================================
// EXTRACT JSON-LD STRUCTURED DATA
// =====================================================
// Some websites use JSON-LD (JSON for Linked Data)
// This is structured data that search engines use

function extractJsonLd($) {
  try {
    // Look for JSON-LD script tags
    const jsonLdScripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < jsonLdScripts.length; i++) {
      const script = jsonLdScripts.eq(i);
      const json = JSON.parse(script.html());

      // Look for Product or Offer schemas
      if (json['@type'] === 'Product' || json['@type'] === 'Offer') {
        return extractFromSchema(json);
      }

      // Sometimes Product is nested inside offers
      if (json.offers && json.offers.price) {
        return {
          title: json.name,
          price: parseFloat(json.offers.price),
          description: json.description
        };
      }
    }

    return null;
  } catch (error) {
    // JSON-LD not found or malformed, return null
    return null;
  }
}

// Recursive function to extract data from schema objects
function extractFromSchema(obj) {
  const data = {};

  if (obj.name) data.title = obj.name;
  if (obj.description) data.description = obj.description;
  if (obj.image) data.image = Array.isArray(obj.image) ? obj.image[0] : obj.image;

  // Price might be in offers
  if (obj.offers) {
    const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
    if (offer.price) {
      data.price = parseFloat(offer.price);
    }
  }

  return Object.keys(data).length > 0 ? data : null;
}

// =====================================================
// EXTRACT BASIC HTML META TAGS
// =====================================================
// Fallback: If Open Graph and JSON-LD fail, try basic HTML meta tags

function extractBasicMeta($) {
  const data = {};

  // Try standard meta tags
  const title = $('meta[name="title"]').attr('content') ||
                $('title').text();
  const description = $('meta[name="description"]').attr('content');

  if (title) data.title = title.trim();
  if (description) data.description = description.trim();

  return Object.keys(data).length > 0 ? data : null;
}

// =====================================================
// EXTRACT PRICE FROM HTML
// =====================================================
// Try to find price in meta tags or data attributes
// Only uses structured data sources (not regex pattern matching on page text)

function extractPrice($) {
  // Only look for price in meta tags or data attributes
  // Pattern matching on page text is too unreliable
  return extractPriceFromMeta($);
}

// Helper function to extract price from meta tags
function extractPriceFromMeta($) {
  // Check for price in Open Graph or other meta tags
  const ogPrice = $('meta[property="og:price"]').attr('content');
  if (ogPrice) {
    const price = parseFloat(ogPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (price > 0) return price;
  }

  // Check for price in data attributes
  const dataPrice = $('[data-price]').first().attr('data-price');
  if (dataPrice) {
    const price = parseFloat(dataPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (price > 0) return price;
  }

  return null;
}

// =====================================================
// MAIN EXTRACTION FUNCTION
// =====================================================
// This is the main function that gets called from server.js
// It tries multiple strategies and returns the best result

async function extractProductInfo(url) {
  try {
    console.log(`🔍 Extracting product info from: ${url}`);

    // Step 1: Fetch the webpage HTML
    const html = await fetchUrl(url);

    // Step 2: Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Step 3: Try extraction strategies in order of preference
    let data = extractOpenGraph($);
    console.log('📋 Open Graph data:', data);

    if (!data) {
      data = extractJsonLd($);
      console.log('📋 JSON-LD data:', data);
    }

    if (!data) {
      data = extractBasicMeta($);
      console.log('📋 Basic meta data:', data);
    }

    // Step 4: If we have basic data, try to extract missing fields
    if (!data) {
      data = {};
    }

    // Step 5: Validate that we have at least some data
    if (!data.title && !data.price) {
      throw new Error('Could not find product information on this page.');
    }

    // Step 6: Validate price is a valid number
    if (data.price && isNaN(data.price)) {
      delete data.price;
    }

    console.log('✅ Extraction complete:', data);

    return data;
  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    throw error;
  }
}

// =====================================================
// EXPORT FUNCTION
// =====================================================

module.exports = {
  extractProductInfo
};

// =====================================================
// HOW THIS WORKS - EXAMPLE
// =====================================================
//
// User pastes: https://www.ikea.com/se/sv/p/billy/...
//
// 1. fetchUrl() downloads the HTML
// 2. cheerio.load() parses it
// 3. extractOpenGraph() looks for:
//    <meta property="og:title" content="BILLY Bookcase">
//    <meta property="og:price" content="399">
// 4. If found, returns: { title: "BILLY Bookcase", price: 399 }
// 5. If not found, tries JSON-LD, then basic meta
// 6. If still nothing, tries to find price in page text
// 7. Returns whatever data was found
//
// Server returns this data to frontend
// Frontend auto-fills form with: name="BILLY Bookcase", cost=399
