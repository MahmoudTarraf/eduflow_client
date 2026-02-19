import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Save, FileText } from 'lucide-react';

const AgreementSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    agreementText: '',
    platformRevenuePercentage: 30,
    instructorRevenuePercentage: 70,
    logoUrl: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSettings({
        agreementText: res.data.data.agreementText || '',
        platformRevenuePercentage: res.data.data.platformRevenuePercentage || 30,
        instructorRevenuePercentage: res.data.data.instructorRevenuePercentage || 70,
        logoUrl: res.data.data.logoUrl || ''
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePercentageChange = (field, value) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    const otherField = field === 'platformRevenuePercentage' 
      ? 'instructorRevenuePercentage' 
      : 'platformRevenuePercentage';
    
    setSettings(prev => ({
      ...prev,
      [field]: numValue,
      [otherField]: 100 - numValue
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put('/api/admin/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Agreement settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Instructor Agreement Settings
            </h2>
          </div>
          <Link
            to="/admin/instructor-agreements"
            className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm font-medium"
          >
            Agreements History
          </Link>
        </div>

        {/* Revenue Sharing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Sharing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Percentage (%)
              </label>
              <input
                type="number"
                name="platformRevenuePercentage"
                value={settings.platformRevenuePercentage}
                onChange={(e) => handlePercentageChange('platformRevenuePercentage', e.target.value)}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instructor Percentage (%)
              </label>
              <input
                type="number"
                name="instructorRevenuePercentage"
                value={settings.instructorRevenuePercentage}
                onChange={(e) => handlePercentageChange('instructorRevenuePercentage', e.target.value)}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Total must equal 100%. Instructor: {settings.instructorRevenuePercentage}% + Platform: {settings.platformRevenuePercentage}% = {settings.platformRevenuePercentage + settings.instructorRevenuePercentage}%
          </p>
        </div>

        {/* Agreement Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agreement Template
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Use {`{platformPercentage}`} and {`{instructorPercentage}`} as placeholders for revenue percentages.
          </p>
          <textarea
            name="agreementText"
            value={settings.agreementText}
            onChange={handleInputChange}
            rows={15}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="Enter the agreement text..."
          />
        </div>

        {/* Logo URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logo Path (Optional)
          </label>
          <input
            type="text"
            name="logoUrl"
            value={settings.logoUrl}
            onChange={handleInputChange}
            placeholder="/uploads/logo.png"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Path to logo file relative to server root (e.g., /uploads/logo.png)
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
            {settings.agreementText
              .replace(/{platformPercentage}/g, settings.platformRevenuePercentage)
              .replace(/{instructorPercentage}/g, settings.instructorRevenuePercentage)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AgreementSettings;
