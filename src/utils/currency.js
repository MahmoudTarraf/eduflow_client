// Cache for default currency
let cachedCurrency = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the default currency from admin settings
 * @returns {Promise<string>} Currency code
 */
export const getDefaultCurrency = async () => {
  // Return cached currency if still valid
  if (cachedCurrency && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return cachedCurrency;
  }

  try {
    const response = await fetch('/api/admin/settings/public');
    
    if (response.ok) {
      const data = await response.json();
      cachedCurrency = data.data?.defaultCurrency || 'SYP';
      cacheTime = Date.now();
      return cachedCurrency;
    }
  } catch (error) {
    console.error('Error fetching default currency:', error);
  }

  // Fallback to SYP
  return 'SYP';
};

/**
 * Format price from cents to display format
 * @param {number} priceCents - Price in cents (e.g., 600000)
 * @param {string} currency - Currency code (e.g., 'USD', 'SYP'). If not provided, uses default from settings
 * @returns {string} Formatted price string
 */
export const formatPrice = (priceCents, currency = null) => {
  if (priceCents === null || priceCents === undefined || isNaN(priceCents)) {
    return '0';
  }

  const price = priceCents / 100;
  
  // Use provided currency or cached currency, fallback to SYP
  const currencyCode = currency || cachedCurrency || 'SYP';

  // For Syrian Pound, don't show decimals
  if (currencyCode === 'SYP') {
    return `${price.toLocaleString()} £S`;
  }

  // For other currencies, use standard formatting
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  } catch (error) {
    // Fallback if currency not supported
    return `${price.toLocaleString()} ${currencyCode}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = null) => {
  const currencyCode = currency || cachedCurrency || 'USD';
  
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'SYP': '£S'
  };
  
  return symbols[currencyCode] || currencyCode;
};

/**
 * Convert display price to cents
 * @param {number} price - Price in dollars/main unit
 * @returns {number} Price in cents
 */
export const priceToCents = (price) => {
  return Math.round(Number(price) * 100);
};

/**
 * Convert cents to display price
 * @param {number} cents - Price in cents
 * @returns {number} Price in dollars/main unit
 */
export const centsToPrice = (cents) => {
  return cents / 100;
};
