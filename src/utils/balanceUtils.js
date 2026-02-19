/**
 * Utility functions for Points-to-Balance conversion and payment calculations
 */

/**
 * Calculate wallet balance from points based on conversion rate
 * @param {number} points - User's total points
 * @param {object} conversionRate - { pointsRequired, sypValue }
 * @returns {number} Balance in SYP
 */
export const calculateWalletBalance = (points, conversionRate) => {
  if (!points || !conversionRate || !conversionRate.pointsRequired || !conversionRate.sypValue) {
    return 0;
  }
  
  return Math.floor((points / conversionRate.pointsRequired) * conversionRate.sypValue);
};

/**
 * Calculate how much balance can be used for a payment
 * Platform covers the discount to protect instructor earnings
 * @param {number} walletBalance - Current wallet balance in SYP
 * @param {number} platformShare - Platform's share of the payment in SYP
 * @returns {number} Amount that can be used from balance
 */
export const calculateUsableBalance = (walletBalance, platformShare) => {
  if (!walletBalance || !platformShare) return 0;
  
  // Can only use up to the platform's share amount
  // This protects instructor earnings from being reduced
  return Math.min(walletBalance, platformShare);
};

/**
 * Calculate payment breakdown with balance usage
 * Platform covers the discount to protect instructor earnings
 * @param {number} totalCost - Total course cost in SYP
 * @param {number} walletBalance - User's wallet balance in SYP
 * @param {number|object} platformPercentageOrOptions - Either the platform percentage (e.g., 20) or an options object
 * @returns {object} Payment breakdown where platform covers the discount
 */
export const calculatePaymentBreakdown = (totalCost, walletBalance, platformPercentageOrOptions = 20) => {
  let platformPercentage = 20;
  let allowPointsDiscount = true;

  if (typeof platformPercentageOrOptions === 'number') {
    platformPercentage = platformPercentageOrOptions;
  } else if (platformPercentageOrOptions && typeof platformPercentageOrOptions === 'object') {
    if (typeof platformPercentageOrOptions.platformPercentage === 'number') {
      platformPercentage = platformPercentageOrOptions.platformPercentage;
    }
    if (typeof platformPercentageOrOptions.allowPointsDiscount === 'boolean') {
      allowPointsDiscount = platformPercentageOrOptions.allowPointsDiscount;
    }
  }

  if (!totalCost || totalCost <= 0 || !walletBalance || walletBalance <= 0) {
    const platformShare = Math.round(((totalCost || 0) * platformPercentage) / 100);
    const instructorShare = (totalCost || 0) - platformShare;
    return {
      originalCost: totalCost || 0,
      platformShare,
      instructorShare,
      usableBalance: 0,
      finalCost: totalCost || 0,
      remainingBalance: walletBalance || 0,
      balanceUsed: 0,
      discountPercentage: 0,
      platformDiscount: 0,
      instructorDiscount: 0,
      platformEarnings: platformShare,
      instructorEarnings: instructorShare
    };
  }

  // Calculate original shares
  const platformShare = Math.round((totalCost * platformPercentage) / 100);
  const instructorShare = totalCost - platformShare;

  let usableBalance = 0;
  let platformDiscount = 0;
  let instructorDiscount = 0;

  if (allowPointsDiscount) {
    // New system: student can use balance up to the full course price
    usableBalance = Math.min(walletBalance, totalCost);

    // Split discount proportionally between platform and instructor
    const totalSharePercent = platformPercentage + (100 - platformPercentage) || 100;
    platformDiscount = Math.round(usableBalance * (platformPercentage / totalSharePercent));
    instructorDiscount = usableBalance - platformDiscount;
  } else {
    // Legacy behaviour: discount only from platform's share, instructor protected
    usableBalance = calculateUsableBalance(walletBalance, platformShare);
    platformDiscount = usableBalance;
    instructorDiscount = 0;
  }

  // Calculate final amounts
  const finalCost = totalCost - usableBalance;
  const remainingBalance = walletBalance - usableBalance;

  // Earnings after discount
  const platformEarnings = platformShare - platformDiscount;
  const instructorEarnings = instructorShare - instructorDiscount;

  return {
    originalCost: totalCost,
    platformShare,
    instructorShare,
    usableBalance,
    finalCost,
    remainingBalance,
    balanceUsed: usableBalance,
    discountPercentage: totalCost > 0 ? Math.round((usableBalance / totalCost) * 100) : 0,
    platformDiscount,
    instructorDiscount,
    platformEarnings,
    instructorEarnings
  };
};

/**
 * Convert amount between currencies using exchange rate
 * @param {number} amount - Amount to convert
 * @param {number} exchangeRate - Exchange rate (SYP to target currency)
 * @param {string} targetCurrency - Target currency code
 * @returns {object} Converted amount with formatted display
 */
export const convertCurrency = (amount, exchangeRate, targetCurrency = 'USD') => {
  if (!amount || !exchangeRate) {
    return { amount: 0, formatted: '0.00', currency: targetCurrency };
  }
  
  const converted = amount / exchangeRate;
  const formatted = converted.toFixed(2);
  
  return {
    amount: converted,
    formatted,
    currency: targetCurrency,
    symbol: getCurrencySymbol(targetCurrency)
  };
};

/**
 * Get currency symbol for display
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'SYP': 'SYP',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  return symbols[currency] || currency;
};

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount, currency = 'SYP') => {
  const symbol = getCurrencySymbol(currency);
  
  if (currency === 'SYP') {
    return `${amount.toLocaleString()} ${symbol}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Lock user balance temporarily during payment processing
 * @param {string} userId - User ID
 * @param {number} amount - Amount to lock
 * @param {string} paymentId - Payment transaction ID
 * @returns {Promise} Lock operation result
 */
export const lockBalance = async (userId, amount, paymentId) => {
  try {
    const response = await fetch('/api/payments/lock-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId, amount, paymentId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error locking balance:', error);
    throw error;
  }
};

/**
 * Release locked balance if payment fails
 * @param {string} paymentId - Payment transaction ID
 * @returns {Promise} Release operation result
 */
export const releaseLockedBalance = async (paymentId) => {
  try {
    const response = await fetch('/api/payments/release-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ paymentId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error releasing balance:', error);
    throw error;
  }
};

/**
 * Confirm balance deduction after successful payment
 * @param {string} paymentId - Payment transaction ID
 * @returns {Promise} Confirmation result
 */
export const confirmBalanceDeduction = async (paymentId) => {
  try {
    const response = await fetch('/api/payments/confirm-balance-deduction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ paymentId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error confirming balance deduction:', error);
    throw error;
  }
};
