import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/currency';

const PayAllPage = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReceivers, setPaymentReceivers] = useState([]);
  const [paymentProviders, setPaymentProviders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Multi-currency state
  const [supportedCurrencies, setSupportedCurrencies] = useState(['USD', 'EUR', 'GBP', 'SYP']);
  const [selectedCurrency, setSelectedCurrency] = useState('SYP');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchPaymentReceivers();
    fetchSupportedCurrencies();
  }, [courseId]);
  
  // Convert currency when selection changes
  useEffect(() => {
    if (sections.length > 0 && selectedCurrency !== 'SYP') {
      convertCurrency();
    } else if (selectedCurrency === 'SYP') {
      const { total } = calculateTotalCost();
      setConvertedAmount(total);
      setExchangeRate(1);
    }
  }, [selectedCurrency, sections]);
  
  const convertCurrency = async () => {
    if (sections.length === 0 || selectedCurrency === 'SYP') return;
    
    try {
      setConverting(true);
      const { total } = calculateTotalCost();
      // IMPORTANT: total is in cents (e.g., 5,000,000 for 50,000 SYP)
      // Must divide by 100 to get actual SYP amount before sending to API
      const actualSYPAmount = Math.round(total / 100);
      
      console.log('💱 Converting total for multiple sections:', {
        totalPriceCents: total,
        actualSYPAmount,
        targetCurrency: selectedCurrency
      });
      
      const res = await axios.post('/api/currency/convert', {
        amountInSYP: actualSYPAmount,
        targetCurrency: selectedCurrency
      });
      
      console.log('✅ Conversion result:', res.data.data);
      
      setConvertedAmount(res.data.data.convertedAmount);
      setExchangeRate(res.data.data.exchangeRate);
    } catch (error) {
      console.error('Currency conversion error:', error);
      toast.error('Failed to convert currency');
    } finally {
      setConverting(false);
    }
  };

  const fetchSections = async () => {
    try {
      // Block suspended students with continueCourses restriction from accessing bulk payment page
      if (user?.status === 'suspended' && user?.restrictions?.continueCourses) {
        toast.error('Your account is suspended. You cannot make new payments or continue courses.');
        navigate('/student');
        return;
      }

      setLoading(true);
      const sectionIds = searchParams.get('sections')?.split(',') || [];
      const token = localStorage.getItem('token');
      
      // Fetch all sections
      const promises = sectionIds.map(id => 
        axios.get(`/api/sections/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      const responses = await Promise.all(promises);
      setSections(responses.map(r => r.data.data));
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch sections');
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

  const getSelectedReceiver = () => {
    if (!paymentMethod) return null;
    return paymentReceivers.find(r => (r.providerKey || r.paymentMethod) === paymentMethod);
  };

  const providerOptions = Array.isArray(paymentProviders)
    ? paymentProviders.filter(p => p && p.key && p.name && p.isActive !== false)
    : [];

  const calculateTotalCost = () => {
    const total = sections.reduce((sum, s) => sum + (s.priceCents || 0), 0);
    const currency = sections[0]?.currency || 'SYP';
    return { total, currency };
  };

  const validateAndSetFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid receipt file (JPEG, PNG, PDF)');
      return false;
    }
    
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
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Submit payment for each section
      const { total } = calculateTotalCost();
      
      console.log('💳 Submitting payments for multiple sections:', {
        totalSections: sections.length,
        totalPriceCents: total,
        selectedCurrency,
        convertedAmount,
        exchangeRate
      });
      
      const promises = sections.map(section => {
        // Calculate amount for this specific section
        let amountInCents;
        if (selectedCurrency === 'SYP') {
          // For SYP, use the original price in cents
          amountInCents = section.priceCents;
        } else {
          // For other currencies, calculate proportional converted amount
          // section.priceCents / total = this section's proportion of total
          const sectionProportion = section.priceCents / total;
          const sectionConvertedAmount = convertedAmount * sectionProportion;
          amountInCents = Math.round(sectionConvertedAmount * 100);
        }
        
        console.log(`  📝 Section: ${section.name}`, {
          baseAmountSYP: section.priceCents,
          currency: selectedCurrency,
          amountCents: amountInCents,
          exchangeRate
        });
        
        const formData = new FormData();
        formData.append('sectionId', section._id);
        formData.append('paymentMethod', paymentMethod);
        formData.append('receipt', receiptFile);
        formData.append('currency', selectedCurrency);
        formData.append('amountCents', amountInCents);
        formData.append('exchangeRate', exchangeRate);
        formData.append('baseAmountSYP', section.priceCents);
        
        return axios.post('/api/enroll/payments', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      });
      
      await Promise.all(promises);
      
      toast.success(`Payment submitted for ${sections.length} section${sections.length > 1 ? 's' : ''}. Awaiting verification.`);
      navigate(`/student/course/${courseId}/details`);
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payment');
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

  const { total, currency } = calculateTotalCost();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pay for All Sections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unlock {sections.length} section{sections.length > 1 ? 's' : ''} with a single payment
            </p>

            {/* Sections List */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Sections Included:</h3>
              <ul className="space-y-2">
                {sections.map((section, index) => (
                  <li key={section._id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {index + 1}. {section.name}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(section.priceCents || 0, section.currency || 'SYP')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
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

                {paymentMethod && !getSelectedReceiver() && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Payment receiver information not available for this method. Please contact support for details.
                    </p>
                  </div>
                )}
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
                  {supportedCurrencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr} {curr === 'SYP' ? '(Syrian Pound)' : curr === 'USD' ? '(US Dollar)' : curr === 'EUR' ? '(Euro)' : '(British Pound)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select the currency you want to pay in
                </p>
              </div>

              {/* Converted Amount Display */}
              {selectedCurrency !== 'SYP' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-700">
                  {converting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-3 text-gray-700 dark:text-gray-300">Converting...</span>
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
                  disabled={submitting || !paymentMethod || !receiptFile || (user?.status === 'suspended' && user?.restrictions?.continueCourses)}
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

export default PayAllPage;
