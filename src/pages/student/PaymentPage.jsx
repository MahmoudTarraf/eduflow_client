import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/currency';
import { calculatePaymentBreakdown, calculateWalletBalance, formatCurrency } from '../../utils/balanceUtils';

const PaymentPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReceivers, setPaymentReceivers] = useState([]);
  const [paymentProviders, setPaymentProviders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  
  // Multi-currency state
  const [supportedCurrencies, setSupportedCurrencies] = useState(['USD', 'EUR', 'GBP', 'SYP']);
  const [selectedCurrency, setSelectedCurrency] = useState('SYP');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [converting, setConverting] = useState(false);
  
  // Balance usage state
  const [useBalance, setUseBalance] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [conversionSettings, setConversionSettings] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);

  useEffect(() => {
    fetchSection();
    fetchPaymentReceivers();
    fetchSupportedCurrencies();
    checkExistingPayment();
    fetchUserStats();
    if (user?.role === 'admin') {
      fetchConversionSettings();
    }
  }, [sectionId, user?.role]);

  const fetchSection = async () => {
    try {
      // Block suspended students with continueCourses restriction from accessing payment page
      if (user?.status === 'suspended' && user?.restrictions?.continueCourses) {
        toast.error('Your account is suspended. You cannot make new payments or continue courses.');
        navigate('/student');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSection(res.data.data);
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch section details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentReceivers = async () => {
    try {
      const res = await axios.get('/api/admin/settings/payment-receivers');
      setPaymentReceivers(res.data.data || []);
      setPaymentProviders(res.data.providers || []);
    } catch (error) {
      console.error('Error fetching payment receivers:', error);
      // Don't show error to user, just log it
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const res = await axios.get('/api/currency/supported');
      const data = res.data?.data || {};
      const currencies = data.supportedCurrencies || ['USD', 'EUR', 'GBP', 'SYP'];
      const defaultCurrency = data.defaultCurrency || 'SYP';
      setSupportedCurrencies(currencies);
      if (currencies.includes(defaultCurrency)) {
        setSelectedCurrency(defaultCurrency);
      } else {
        setSelectedCurrency(currencies[0] || 'SYP');
      }
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
    }
  };

  const checkExistingPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      // Check if there's already a pending or approved payment for this section
      const res = await axios.get(`/api/sections/${sectionId}/access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.latestPayment && res.data.latestPayment.status === 'pending') {
        setExistingPayment(res.data.latestPayment);
      } else if (res.data.hasAccess && res.data.reason === 'paid') {
        // User already has access
        toast.info('You already have access to this section');
        const sectionRes = await axios.get(`/api/sections/${sectionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const courseId = sectionRes.data.data.course._id || sectionRes.data.data.course;
        navigate(`/student/course/${courseId}/details`);
      }
    } catch (error) {
      console.error('Error checking existing payment:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/gamification/my-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = res.data.stats;
      setUserStats(stats);
      // Also hydrate conversion settings from stats (public-safe)
      if (stats?.conversionRate) {
        setConversionSettings(prev => prev || {
          pointsRequired: stats.conversionRate.pointsRequired ?? 500,
          sypValue: stats.conversionRate.sypValue ?? 10000,
          minimumPointsThreshold: stats.conversionRate.minimumPointsThreshold ?? 500,
          enableBalancePayments: stats.conversionRate.enableBalancePayments !== false
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchConversionSettings = async () => {
    try {
      const res = await axios.get('/api/gamification/settings');
      setConversionSettings(res.data.conversionSettings || { pointsRequired: 500, sypValue: 10000, enableBalancePayments: true, minimumPointsThreshold: 500 });
    } catch (error) {
      console.error('Error fetching conversion settings:', error);
      // Fallback to default values
      setConversionSettings({ pointsRequired: 500, sypValue: 10000, enableBalancePayments: true, minimumPointsThreshold: 500 });
    }
  };

  // Calculate payment breakdown when balance usage changes
  useEffect(() => {
    if (section && userStats && conversionSettings) {
      const walletBalance = calculateWalletBalance(userStats.points, conversionSettings);

      // If a non-SYP currency is selected but we don't have a valid conversion yet,
      // skip calculating the breakdown to avoid using a stale or incorrect amount.
      if (selectedCurrency !== 'SYP' && (convertedAmount == null || Number.isNaN(convertedAmount))) {
        setPaymentBreakdown(null);
        return;
      }

      const totalCostCents = selectedCurrency === 'SYP'
        ? section.priceCents
        : Math.round(convertedAmount * 100);
      const totalCost = totalCostCents / 100; // Convert to actual amount
      
      if (useBalance && walletBalance > 0) {
        const breakdown = calculatePaymentBreakdown(totalCost, walletBalance, {
          allowPointsDiscount: section?.course?.allowPointsDiscount !== false
        });
        setPaymentBreakdown(breakdown);
      } else {
        setPaymentBreakdown(null);
      }
    } else {
      setPaymentBreakdown(null);
    }
  }, [useBalance, section, userStats, conversionSettings, selectedCurrency, convertedAmount]);

  // Convert currency when selection changes
  useEffect(() => {
    if (section && selectedCurrency !== 'SYP') {
      convertCurrency();
    } else if (selectedCurrency === 'SYP') {
      setConvertedAmount(section?.priceCents);
      setExchangeRate(1);
    }
  }, [selectedCurrency, section]);

  const convertCurrency = async () => {
    if (!section || selectedCurrency === 'SYP') return;
    
    try {
      setConverting(true);
      
      // IMPORTANT: section.priceCents is stored in cents, so divide by 100 to get actual SYP amount
      const actualSYPAmount = section.priceCents / 100;
      
      console.log(' Converting currency:', {
        priceCents: section.priceCents,
        actualSYPAmount,
        targetCurrency: selectedCurrency
      });
      
      const res = await axios.post('/api/currency/convert', {
        amountInSYP: actualSYPAmount,
        targetCurrency: selectedCurrency
      });
      
      console.log(' Conversion result:', res.data.data);
      
      setConvertedAmount(res.data.data.convertedAmount);
      setExchangeRate(res.data.data.exchangeRate);
    } catch (error) {
      console.error(' Currency conversion error:', error);
      toast.error('Failed to convert currency. Falling back to Syrian Pound (SYP).');

      // Fallback: revert to SYP to avoid showing or submitting incorrect amounts
      setSelectedCurrency('SYP');
      setConvertedAmount(null);
      setExchangeRate(1);
    } finally {
      setConverting(false);
    }
  };

  const validateAndSetFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid receipt file (JPEG, PNG, PDF)');
      return false;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return false;
    }
    
    setReceiptFile(file);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const getSelectedReceiver = () => {
    if (!paymentMethod) return null;
    return paymentReceivers.find(r => (r.providerKey || r.paymentMethod) === paymentMethod);
  };

  const providerOptions = Array.isArray(paymentProviders)
    ? paymentProviders.filter(p => p && p.key && p.name && p.isActive !== false)
    : [];

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (user?.status === 'suspended' && user?.restrictions?.continueCourses) {
      toast.error('Your account is suspended. You cannot make new payments or continue courses.');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    if (!receiptFile) {
      toast.error('Please upload a payment receipt');
      return;
    }
    
    // For non-SYP payments, ensure conversion has completed successfully
    if (selectedCurrency !== 'SYP') {
      if (converting) {
        toast.error('Please wait until the currency conversion finishes before submitting.');
        return;
      }

      if (convertedAmount == null || Number.isNaN(convertedAmount)) {
        toast.error('Currency conversion failed. Please try again or switch back to SYP.');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('sectionId', sectionId);
      formData.append('paymentMethod', paymentMethod);
      formData.append('receipt', receiptFile);
      
      // Multi-currency payment data
      // baseAmountSYP: Original price in SYP (stored in cents, e.g., 5000000 = 50,000 SYP)
      formData.append('baseAmountSYP', section.priceCents);
      
      // amountCents: Amount in selected currency (must be in cents)
      // For SYP: use section.priceCents directly (already in cents)
      // For other currencies: convertedAmount is actual amount (e.g., 4.55 USD), convert to cents
      const amountInCents = selectedCurrency === 'SYP' 
        ? section.priceCents 
        : Math.round(convertedAmount * 100);
      
      formData.append('currency', selectedCurrency);
      formData.append('amountCents', amountInCents);
      formData.append('exchangeRate', exchangeRate);
      
      // Balance usage data
      if (useBalance && paymentBreakdown) {
        formData.append('useBalance', 'true');
        formData.append('balanceUsed', Math.round(paymentBreakdown.usableBalance * 100)); // Convert to cents
        formData.append('finalAmountCents', Math.round(paymentBreakdown.finalCost * 100)); // Convert to cents
        formData.append('balanceDiscountPercentage', paymentBreakdown.discountPercentage);
      } else {
        formData.append('useBalance', 'false');
        formData.append('balanceUsed', '0');
        formData.append('finalAmountCents', amountInCents);
        formData.append('balanceDiscountPercentage', '0');
      }
      
      console.log(' Submitting payment:', {
        baseAmountSYP: section.priceCents,
        currency: selectedCurrency,
        amountCents: amountInCents,
        exchangeRate,
        useBalance,
        balanceUsed: paymentBreakdown?.usableBalance || 0,
        finalAmount: paymentBreakdown?.finalCost || (amountInCents / 100)
      });
      
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/enroll/payments', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success(res.data.message + ' - Your payment will be reviewed by admin.');
      // Navigate back to course details page (don't go to section content until approved)
      const sectionRes = await axios.get(`/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const courseId = sectionRes.data.data.course._id || sectionRes.data.data.course;
      navigate(`/student/course/${courseId}/details`);
    } catch (error) {
      console.error('Payment submission error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to submit payment';
      toast.error(errorMessage);
      
      // If 403, might be authentication issue
      if (error.response?.status === 403) {
        toast.error('Authentication error. Please try logging out and back in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {existingPayment && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  You already have a pending payment for this section submitted on {new Date(existingPayment.submittedAt).toLocaleDateString()}. 
                  Please wait for admin approval before submitting another payment.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment for {section?.name}
            </h1>
            
            <div className="mb-6 space-y-4">
              {/* Original Price in SYP */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Original Price (SYP):</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(section?.priceCents || 0, 'SYP')}
                  </span>
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Payment Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {supportedCurrencies.map(currency => (
                    <option key={currency} value={currency}>
                      {currency === 'USD' && ' US Dollar (USD)'}
                      {currency === 'EUR' && ' Euro (EUR)'}
                      {currency === 'GBP' && ' British Pound (GBP)'}
                      {currency === 'SYP' && ' Syrian Pound (SYP)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Converted Amount Display */}
              {selectedCurrency !== 'SYP' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-700">
                  {converting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Converting...</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">You will pay:</span>
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {convertedAmount?.toFixed(2)} {selectedCurrency}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Exchange rate: 1 SYP = {exchangeRate?.toFixed(6)} {selectedCurrency}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Balance Usage Section */}
              {userStats && conversionSettings && conversionSettings.enableBalancePayments !== false && (
                (() => {
                  const walletBalance = calculateWalletBalance(userStats.points, conversionSettings);
                  const minimumThreshold = conversionSettings.minimumPointsThreshold || 500;
                  const hasEnoughPoints = userStats.points >= minimumThreshold;
                  
                  // Show balance section if has balance, but may be disabled if below threshold
                  return walletBalance > 0 || userStats.points > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/30 rounded-full flex items-center justify-center mr-3">
                              <span className="text-purple-600 dark:text-purple-400 font-bold">💰</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Use Wallet Balance</h3>
                          </div>
                          <div className="ml-11 space-y-2">
                            {hasEnoughPoints ? (
                              <>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  You have <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(walletBalance)}</span> available in your wallet
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  Earned from {userStats.points.toLocaleString()} points • Rate: {conversionSettings.pointsRequired} pts = {formatCurrency(conversionSettings.sypValue)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  You have <span className="font-semibold">{userStats.points.toLocaleString()} points</span>
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  ⚠️ Not enough points. Minimum required: {minimumThreshold.toLocaleString()} points
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  Keep earning points to unlock balance usage!
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <label className={`relative inline-flex items-center ${hasEnoughPoints ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <input
                              type="checkbox"
                              checked={useBalance && hasEnoughPoints}
                              onChange={(e) => hasEnoughPoints && setUseBalance(e.target.checked)}
                              disabled={!hasEnoughPoints}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 peer-disabled:bg-gray-300 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        </div>
                      </div>
                      
                      {/* Payment Breakdown */}
                      {useBalance && paymentBreakdown && (
                        <div className="mt-4 ml-11 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Original Cost:</span>
                              <span className="text-gray-900 dark:text-white">{formatCurrency(paymentBreakdown.originalCost, selectedCurrency)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                              <span>Balance Discount:</span>
                              <span>-{formatCurrency(paymentBreakdown.usableBalance, selectedCurrency)} ({paymentBreakdown.discountPercentage}% off)</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                              <div className="flex justify-between font-bold">
                                <span className="text-gray-900 dark:text-white">Final Amount:</span>
                                <span className="text-xl text-indigo-600 dark:text-indigo-400">{formatCurrency(paymentBreakdown.finalCost, selectedCurrency)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
                              <span>Remaining Balance:</span>
                              <span>{formatCurrency(paymentBreakdown.remainingBalance)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()
              )}

              {/* If disabled by admin, show notice */}
              {conversionSettings && conversionSettings.enableBalancePayments === false && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Paying with wallet balance is currently disabled by the administrator.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select payment method</option>
                  {providerOptions.length > 0 ? (
                    providerOptions.map((p) => (
                      <option key={p.key} value={p.key}>{p.name}</option>
                    ))
                  ) : (
                    <option value="other">Other</option>
                  )}
                </select>

                {/* Display payment receiver information */}
                {paymentMethod && getSelectedReceiver() && (
                  <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                    <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Payment Receiver Information
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-medium">Name:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{getSelectedReceiver().receiverName}</span>
                      </div>
                      {getSelectedReceiver().receiverEmail && (
                        <div>
                          <span className="font-medium">Email:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{getSelectedReceiver().receiverEmail}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Phone:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{getSelectedReceiver().receiverPhone}</span>
                      </div>
                      {getSelectedReceiver().receiverLocation && (
                        <div>
                          <span className="font-medium">Location:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{getSelectedReceiver().receiverLocation}</span>
                        </div>
                      )}
                      {getSelectedReceiver().accountDetails && (
                        <div>
                          <span className="font-medium">Account Details:</span>{' '}
                          <p className="text-gray-900 dark:text-white whitespace-pre-wrap mt-1">{getSelectedReceiver().accountDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* If no receiver information is available for selected method */}
                {paymentMethod && !getSelectedReceiver() && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Payment receiver information not available for this method. Please contact support for details.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Payment Receipt
                </label>
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, PDF up to 10MB
                    </p>
                    {receiptFile && (
                      <p className="text-sm text-gray-900 dark:text-white mt-2">
                        Selected: {receiptFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !paymentMethod ||
                    !receiptFile ||
                    existingPayment ||
                    converting ||
                    (selectedCurrency !== 'SYP' && (convertedAmount == null || Number.isNaN(convertedAmount))) ||
                    (user?.status === 'suspended' && user?.restrictions?.continueCourses)
                  }
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                >
                  {submitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
