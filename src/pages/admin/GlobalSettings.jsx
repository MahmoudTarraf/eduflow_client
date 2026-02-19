import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Settings, DollarSign, FileText, Plus, Trash2 } from 'lucide-react';

const currencyOptions = [
  { value: 'SYP', label: 'Syrian Pound (SYP)' },
  { value: 'SYR', label: 'Syrian Pound (SYR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' }
];

const GlobalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingIntro, setResettingIntro] = useState(false);

  const [settings, setSettings] = useState({
    platformName: '',
    platformEmail: '',
    platformIntro: '',
    facebookUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    maxIntroVideosForInstructor: 3,
    showRatingsOnHomepage: true,
    homepageRatingsLimit: 10,
    currencyStudentPays: 'SYP',
    platformCurrency: 'SYP',
    supportedCurrencies: ['SYP'],
    minimumPayoutRequest: 10000,
    initialSignupPercentage: 30,
    instructorSignupPercentage: 70,
    agreementText: '',
    paymentProviders: []
  });

  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [updatingRatingId, setUpdatingRatingId] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchHomepageRatingsForAdmin();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;

        const platformPct =
          d.initialSignupPercentage ?? d.platformRevenuePercentage ?? 30;
        const instructorPct = 100 - Number(platformPct || 0);

        setSettings({
          platformName: d.platformName || '',
          platformEmail: d.platformEmail || '',
          platformIntro: d.platformIntro || '',
          facebookUrl: d.facebookUrl || '',
          githubUrl: d.githubUrl || '',
          linkedinUrl: d.linkedinUrl || '',
          maxIntroVideosForInstructor:
            d.maxIntroVideosForInstructor ?? d.introVideoMaxReuploads ?? 3,
          showRatingsOnHomepage:
            d.showRatingsOnHomepage ?? d.showHomepageRatings ?? true,
          homepageRatingsLimit:
            d.homepageRatingsLimit ?? d.featuredRatingsLimit ?? 10,
          currencyStudentPays: d.currencyStudentPays || d.defaultCurrency || 'SYP',
          platformCurrency: d.platformCurrency || d.defaultCurrency || 'SYP',
          supportedCurrencies:
            Array.isArray(d.supportedCurrencies) && d.supportedCurrencies.length
              ? d.supportedCurrencies
              : ['SYP'],
          minimumPayoutRequest:
            d.minimumPayoutRequest ?? d.minimumPayoutAmountSYP ?? 10000,
          initialSignupPercentage: platformPct,
          instructorSignupPercentage: Math.max(0, Math.min(100, instructorPct)),
          agreementText: d.agreementText || '',
          paymentProviders: Array.isArray(d.paymentProviders) ? d.paymentProviders : []
        });
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
      toast.error(error.response?.data?.message || 'Failed to load global settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchHomepageRatingsForAdmin = async () => {
    try {
      setRatingsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/ratings/featured-admin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && Array.isArray(res.data.ratings)) {
        setRatings(res.data.ratings);
      } else {
        setRatings([]);
      }
    } catch (error) {
      console.error('Error fetching homepage ratings for admin:', error);
      toast.error(error.response?.data?.message || 'Failed to load ratings list');
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clampPercentage = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  const handlePlatformPercentageChange = value => {
    setSettings(prev => {
      const platformPct = clampPercentage(value);
      const instructorPct = clampPercentage(100 - platformPct);
      return {
        ...prev,
        initialSignupPercentage: platformPct,
        instructorSignupPercentage: instructorPct
      };
    });
  };

  const handleInstructorPercentageChange = value => {
    setSettings(prev => {
      const instructorPct = clampPercentage(value);
      const platformPct = clampPercentage(100 - instructorPct);
      return {
        ...prev,
        initialSignupPercentage: platformPct,
        instructorSignupPercentage: instructorPct
      };
    });
  };

  const handleSupportedCurrencyChange = (code, checked) => {
    setSettings(prev => {
      const existing = Array.isArray(prev.supportedCurrencies) ? prev.supportedCurrencies : [];
      let next = [...existing];

      if (checked) {
        if (!next.includes(code)) {
          next.push(code);
        }
      } else {
        next = next.filter(c => c !== code);
      }

      if (!next.includes('SYP')) {
        next.push('SYP');
      }

      return {
        ...prev,
        supportedCurrencies: next
      };
    });
  };

  const toProviderKey = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
  };

  const normalizeProviders = (list) => {
    const providers = Array.isArray(list) ? list : [];

    const sanitized = providers
      .map((p) => {
        const name = typeof p?.name === 'string' ? p.name.trim() : '';
        const key = toProviderKey(p?.key || name);
        const imageUrl = typeof p?.imageUrl === 'string' ? p.imageUrl.trim() : '';
        const isActive = p?.isActive !== false;

        return { key, name, imageUrl, isActive };
      })
      .filter((p) => p.key && p.name);

    const seen = new Set();
    const deduped = [];
    for (const p of sanitized) {
      if (seen.has(p.key)) continue;
      seen.add(p.key);
      deduped.push(p);
    }

    return deduped;
  };

  const handleAddPaymentProvider = () => {
    setSettings((prev) => ({
      ...prev,
      paymentProviders: [
        ...(Array.isArray(prev.paymentProviders) ? prev.paymentProviders : []),
        { key: '', name: '', imageUrl: '', isActive: true }
      ]
    }));
  };

  const handleUpdatePaymentProvider = (index, field, value) => {
    setSettings((prev) => {
      const list = Array.isArray(prev.paymentProviders) ? [...prev.paymentProviders] : [];
      const current = list[index] || { key: '', name: '', imageUrl: '', isActive: true };
      const next = { ...current, [field]: value };

      if (field === 'name' && (!current.key || !String(current.key).trim())) {
        next.key = toProviderKey(value);
      }

      list[index] = next;
      return { ...prev, paymentProviders: list };
    });
  };

  const handleRemovePaymentProvider = (index) => {
    setSettings((prev) => {
      const list = Array.isArray(prev.paymentProviders) ? [...prev.paymentProviders] : [];
      list.splice(index, 1);
      return { ...prev, paymentProviders: list };
    });
  };

  const handleToggleRatingHomepageVisibility = async (ratingId, isHidden) => {
    try {
      setUpdatingRatingId(ratingId);
      const token = localStorage.getItem('token');

      const res = await axios.patch(
        `/api/ratings/${ratingId}/homepage-visibility`,
        { isHiddenOnHomepage: !isHidden },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(res.data?.message || 'Homepage visibility updated');

      const updated = res.data?.rating;

      setRatings(prev =>
        prev.map(r =>
          r._id === ratingId
            ? {
                ...r,
                isHiddenOnHomepage:
                  updated && Object.prototype.hasOwnProperty.call(updated, 'isHiddenOnHomepage')
                    ? updated.isHiddenOnHomepage
                    : !isHidden
              }
            : r
        )
      );
    } catch (error) {
      console.error('Error updating rating homepage visibility:', error);
      toast.error(error.response?.data?.message || 'Failed to update rating visibility');
    } finally {
      setUpdatingRatingId(null);
    }
  };

  const handleSave = async () => {
    try {
      const payload = { ...settings };

      // Enforce SYP as the base/default currency for accounting and conversions
      payload.currencyStudentPays = 'SYP';
      payload.platformCurrency = 'SYP';

      const hpLimit = Number(payload.homepageRatingsLimit);
      if (!Number.isFinite(hpLimit) || hpLimit < 1) {
        toast.error('Homepage ratings limit must be at least 1');
        return;
      }

      const signupPct = Number(payload.initialSignupPercentage);
      if (!Number.isFinite(signupPct) || signupPct < 0 || signupPct > 100) {
        toast.error('Signup percentage must be between 0 and 100');
        return;
      }

      const minPayout = Number(payload.minimumPayoutRequest);
      if (!Number.isFinite(minPayout) || minPayout < 0) {
        toast.error('Minimum payout request must be a non-negative number');
        return;
      }

      const validCurrencies = currencyOptions.map(c => c.value);
      if (!validCurrencies.includes(payload.currencyStudentPays)) {
        toast.error('Invalid student payment currency');
        return;
      }
      if (!validCurrencies.includes(payload.platformCurrency)) {
        toast.error('Invalid platform currency');
        return;
      }

      // Normalize and validate supported currencies (always include SYP)
      let supported = Array.isArray(payload.supportedCurrencies)
        ? payload.supportedCurrencies
        : [payload.currencyStudentPays || 'SYP'];

      supported = supported
        .map(c => String(c).toUpperCase())
        .filter(Boolean);

      if (!supported.includes('SYP')) {
        supported.unshift('SYP');
      }

      const uniqueSupported = Array.from(new Set(supported));

      if (!uniqueSupported.every(c => validCurrencies.includes(c))) {
        toast.error('Supported currencies must be valid currency codes');
        return;
      }

      payload.supportedCurrencies = uniqueSupported;

      const maxIntro = Number(payload.maxIntroVideosForInstructor);
      if (!Number.isFinite(maxIntro) || maxIntro < 0) {
        toast.error('Max intro videos must be a non-negative integer');
        return;
      }

      setSaving(true);
      const token = localStorage.getItem('token');

      const body = {
        platformName: payload.platformName,
        platformEmail: payload.platformEmail,
        platformIntro: payload.platformIntro,
        facebookUrl: payload.facebookUrl,
        githubUrl: payload.githubUrl,
        linkedinUrl: payload.linkedinUrl,
        maxIntroVideosForInstructor: maxIntro,
        showRatingsOnHomepage: !!payload.showRatingsOnHomepage,
        homepageRatingsLimit: hpLimit,
        currencyStudentPays: payload.currencyStudentPays,
        platformCurrency: payload.platformCurrency,
        supportedCurrencies: payload.supportedCurrencies,
        minimumPayoutRequest: minPayout,
        initialSignupPercentage: signupPct,
        agreementText: payload.agreementText,
        paymentProviders: normalizeProviders(payload.paymentProviders)
      };

      const res = await axios.put('/api/admin/settings', body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(res.data?.message || 'Global settings updated successfully');
      if (res.data?.data) {
        const d = res.data.data;
        setSettings(prev => ({
          ...prev,
          platformName: d.platformName || prev.platformName,
          platformEmail: d.platformEmail || prev.platformEmail,
          platformIntro: d.platformIntro || prev.platformIntro,
          facebookUrl: d.facebookUrl || prev.facebookUrl,
          githubUrl: d.githubUrl || prev.githubUrl,
          linkedinUrl: d.linkedinUrl || prev.linkedinUrl,
          maxIntroVideosForInstructor:
            d.maxIntroVideosForInstructor ?? d.introVideoMaxReuploads ?? prev.maxIntroVideosForInstructor,
          showRatingsOnHomepage:
            d.showRatingsOnHomepage ?? d.showHomepageRatings ?? prev.showRatingsOnHomepage,
          homepageRatingsLimit:
            d.homepageRatingsLimit ?? d.featuredRatingsLimit ?? prev.homepageRatingsLimit,
          currencyStudentPays: d.currencyStudentPays || d.defaultCurrency || prev.currencyStudentPays,
          platformCurrency: d.platformCurrency || d.defaultCurrency || prev.platformCurrency,
          supportedCurrencies:
            Array.isArray(d.supportedCurrencies) && d.supportedCurrencies.length
              ? d.supportedCurrencies
              : prev.supportedCurrencies,
          minimumPayoutRequest:
            d.minimumPayoutRequest ?? d.minimumPayoutAmountSYP ?? prev.minimumPayoutRequest,
          initialSignupPercentage:
            d.initialSignupPercentage ?? d.platformRevenuePercentage ?? prev.initialSignupPercentage,
          instructorSignupPercentage:
            100 - (d.initialSignupPercentage ?? d.platformRevenuePercentage ?? prev.initialSignupPercentage),
          agreementText: d.agreementText ?? prev.agreementText,
          paymentProviders: Array.isArray(d.paymentProviders) ? d.paymentProviders : prev.paymentProviders
        }));
      }
    } catch (error) {
      console.error('Error saving global settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save global settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetIntroCounters = async () => {
    try {
      setResettingIntro(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/settings/reset-intro-videos-counter', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data?.message || 'Intro video upload counters reset');
    } catch (error) {
      console.error('Error resetting intro counters:', error);
      toast.error(error.response?.data?.message || 'Failed to reset intro counters');
    } finally {
      setResettingIntro(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Admin Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure platform-wide behavior for instructors, ratings, currency, payouts, and signup agreements.
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Platform Identity & Social */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Identity & Social</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={e => handleFieldChange('platformName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform Email
                </label>
                <input
                  type="email"
                  value={settings.platformEmail}
                  onChange={e => handleFieldChange('platformEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used across the platform footer and policy pages as the primary contact email.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform Introduction
                </label>
                <textarea
                  rows={4}
                  value={settings.platformIntro}
                  onChange={e => handleFieldChange('platformIntro', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Short description shown in the footer and other public places."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={settings.facebookUrl}
                    onChange={e => handleFieldChange('facebookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="https://facebook.com/your-page"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={settings.githubUrl}
                    onChange={e => handleFieldChange('githubUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="https://github.com/your-org"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={settings.linkedinUrl}
                    onChange={e => handleFieldChange('linkedinUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="https://linkedin.com/company/your-page"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Intro Video Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Intro Video Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Intro Video Reuploads per Instructor
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.maxIntroVideosForInstructor}
                  onChange={e => handleFieldChange('maxIntroVideosForInstructor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Controls how many times each instructor can re-upload their introduction video before admin intervention is required. Default is 3 reuploads per instructor unless changed here.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Reset re-upload counters for all instructors back to 0 so each instructor can use the full limit again.
                </p>
                <button
                  type="button"
                  onClick={handleResetIntroCounters}
                  disabled={resettingIntro}
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingIntro ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Reset Counters
                </button>
              </div>
            </div>
          </div>

          {/* Ratings Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ratings Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Show Ratings on Homepage</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Toggle visibility of the testimonials / ratings slider on the homepage.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!settings.showRatingsOnHomepage}
                    onChange={e => handleFieldChange('showRatingsOnHomepage', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum Ratings on Homepage
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.homepageRatingsLimit}
                  onChange={e => handleFieldChange('homepageRatingsLimit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used by the featured ratings API to limit how many testimonials are shown.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Homepage Ratings List (4★+ with review)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Toggle individual ratings to show or hide them on the homepage slider.
                </p>
                {ratingsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                  </div>
                ) : ratings.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                    No ratings are currently available for homepage display.
                  </p>
                ) : (
                  <div className="mt-2 max-h-72 overflow-y-auto space-y-3 pr-1">
                    {ratings.map(rating => {
                      const hidden = !!rating.isHiddenOnHomepage;
                      return (
                        <div
                          key={rating._id}
                          className="flex items-start justify-between rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {rating.student?.name || 'Student'}
                              {rating.course?.name ? ` · ${rating.course.name}` : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {rating.review}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Rating: {rating.rating} / 5
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <button
                              type="button"
                              onClick={() => handleToggleRatingHomepageVisibility(rating._id, hidden)}
                              disabled={updatingRatingId === rating._id}
                              className="inline-flex items-center px-2.5 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingRatingId === rating._id
                                ? 'Updating...'
                                : hidden
                                ? 'Show on homepage'
                                : 'Hide from homepage'}
                            </button>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {hidden ? 'Hidden on homepage' : 'Visible on homepage'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currency & Payout Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Currency & Payout Settings</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base Currency (Platform Accounting)
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  All course prices and payouts are stored in Syrian Pounds (SYP). Currency conversion always starts from SYP.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supported Payment Currencies for Students
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      id="currency-syp"
                      type="checkbox"
                      checked={Array.isArray(settings.supportedCurrencies) ? settings.supportedCurrencies.includes('SYP') : true}
                      disabled
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="currency-syp" className="text-sm text-gray-700 dark:text-gray-300">
                      Syrian Pound (SYP)
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(always enabled as base currency)</span>
                    </label>
                  </div>
                  {currencyOptions
                    .filter(option => option.value !== 'SYP')
                    .map(option => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <input
                          id={`currency-${option.value.toLowerCase()}`}
                          type="checkbox"
                          checked={Array.isArray(settings.supportedCurrencies)
                            ? settings.supportedCurrencies.includes(option.value)
                            : false}
                          onChange={e => handleSupportedCurrencyChange(option.value, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`currency-${option.value.toLowerCase()}`}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Students can choose any of the supported currencies on the payment pages. Amounts are converted from SYP using the latest rates.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Instructor Payout Request (SYP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.minimumPayoutRequest}
                  onChange={e => handleFieldChange('minimumPayoutRequest', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Controls when instructors are allowed to request payouts. Existing payout flows read this value from global settings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Providers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  These payment providers appear on the homepage and student payment pages.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPaymentProvider}
                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </button>
            </div>

            {(!Array.isArray(settings.paymentProviders) || settings.paymentProviders.length === 0) ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No payment providers configured yet.
              </div>
            ) : (
              <div className="space-y-3">
                {settings.paymentProviders.map((provider, index) => (
                  <div
                    key={provider?.key || index}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={provider?.name || ''}
                          onChange={(e) => handleUpdatePaymentProvider(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="e.g., Western Union"
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={provider?.imageUrl || ''}
                          onChange={(e) => handleUpdatePaymentProvider(index, 'imageUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="md:col-span-2 flex items-start justify-between gap-3">
                        <div className="pt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={provider?.isActive !== false}
                              onChange={(e) => handleUpdatePaymentProvider(index, 'isActive', e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentProvider(index)}
                          className="mt-6 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                        Key: {provider?.key || toProviderKey(provider?.name)}
                      </div>
                      {provider?.imageUrl ? (
                        <img
                          src={provider.imageUrl}
                          alt={provider.name || 'Payment provider'}
                          className="h-10 w-24 object-contain bg-white rounded border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signup Agreement Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signup Agreement Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Revenue Split for New Instructors
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This split is used when generating the default instructor agreement for new instructors. The platform and instructor percentages must always add up to 100%. Existing signed agreements keep their original percentages.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Platform Commission (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.initialSignupPercentage}
                      onChange={e => handlePlatformPercentageChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instructor Share (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.instructorSignupPercentage}
                      onChange={e => handleInstructorPercentageChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Current split: Platform {Math.max(0, Math.min(100, Number(settings.initialSignupPercentage || 0)))}% · Instructor {Math.max(0, Math.min(100, Number(settings.instructorSignupPercentage || 0)))}% (total 100%).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructor Agreement Template
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Use {'{platformPercentage}'} and {'{instructorPercentage}'} as placeholders inside the text. These are replaced when agreements are generated.
                </p>
                <textarea
                  rows={10}
                  value={settings.agreementText}
                  onChange={e => handleFieldChange('agreementText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Enter the global instructor agreement text..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;

