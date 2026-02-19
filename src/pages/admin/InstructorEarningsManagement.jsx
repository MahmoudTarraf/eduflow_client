import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { DollarSign, FileText, Check, X, Clock, TrendingUp, Users, Send, Download, AlertCircle, Edit2, Save, XCircle } from 'lucide-react';

const InstructorEarningsManagement = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({ platformPercentage: 30, instructorPercentage: 70 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredAgreements(agreements);
    } else {
      setFilteredAgreements(agreements.filter(a => a.status === filterStatus));
    }
  }, [filterStatus, agreements]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [statsRes, agreementsRes, settingsRes] = await Promise.all([
        axios.get('/api/instructor-agreements/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/instructor-agreements', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data.data);
      setAgreements(agreementsRes.data.data);
      setFilteredAgreements(agreementsRes.data.data);
      
      // Update global settings with actual values from database
      if (settingsRes.data.data) {
        setGlobalSettings({
          platformPercentage: settingsRes.data.data.platformRevenuePercentage || 30,
          instructorPercentage: settingsRes.data.data.instructorRevenuePercentage || 70
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGlobalSettings = async (e) => {
    e.preventDefault();
    if (globalSettings.platformPercentage + globalSettings.instructorPercentage !== 100) {
      toast.error('Percentages must sum to 100%');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/instructor-agreements/update-global-settings', globalSettings, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(
        <div>
          <p className="font-semibold">Global settings updated successfully!</p>
          <p className="text-sm mt-1">
            {response.data.successCount > 0 
              ? `PDF agreements sent to ${response.data.successCount} instructor(s)`
              : 'No new agreements created'}
          </p>
        </div>,
        { duration: 5000 }
      );
      
      setShowGlobalSettings(false);
      fetchData();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Instructor Earnings Management
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage global earnings settings and instructor agreements
          </p>
        </div>

        {/* Current Global Settings Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`${theme === 'dark' ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} rounded-lg shadow-lg p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Current Global Revenue Split
              </h3>
              <div className="flex items-center space-x-8">
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Platform Commission</p>
                  <p className="text-white text-3xl font-bold">{globalSettings.platformPercentage}%</p>
                </div>
                <div className="text-white text-2xl">→</div>
                <div>
                  <p className="text-purple-200 text-sm mb-1">Instructor Earnings</p>
                  <p className="text-white text-3xl font-bold">{globalSettings.instructorPercentage}%</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowGlobalSettings(true)}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center space-x-2">
              <Edit2 className="w-4 h-4" />
              <span>Update</span>
            </button>
          </div>
        </motion.div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Instructors', value: stats.totalInstructors, icon: Users, color: 'indigo' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow' },
              { label: 'Approved', value: stats.approved, icon: Check, color: 'green' },
              { label: 'Custom Agreements', value: stats.customAgreements, icon: TrendingUp, color: 'purple' }
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-10 h-10 text-${stat.color}-500`} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className={`mb-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex space-x-8">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filterStatus === status
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && stats && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {stats[status]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAgreements.length === 0 ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
              <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No agreements found</p>
            </div>
          ) : (
            filteredAgreements.map((agreement) => (
              <motion.div key={agreement._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {agreement.instructor?.name || 'Unknown'}
                      </h3>
                      {(agreement.instructor?.isDeleted || agreement.instructor?.status === 'deleted') && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          Deleted Instructor
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      {agreement.instructor?.email || 'No email'}
                    </p>
                    <div className="flex items-center space-x-6 mb-3">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        Platform: {agreement.platformPercentage}%
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        Instructor: {agreement.instructorPercentage}%
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        agreement.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                        agreement.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {agreement.status}
                      </span>
                    </div>
                    {agreement.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-sm text-red-700 dark:text-red-300">Reason: {agreement.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  {agreement.pdfUrl && (
                    <a href={agreement.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {showGlobalSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Update Global Settings
                </h2>
                <button onClick={() => setShowGlobalSettings(false)}>
                  <X className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
              </div>
              
              {/* Info Alert */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                    <p className="font-semibold mb-1">What happens when you update?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Global settings will be updated immediately</li>
                      <li>New PDF agreements will be generated for all instructors</li>
                      <li>Email notifications will be sent to all approved instructors</li>
                      <li>Instructors with custom agreements will not be affected</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateGlobalSettings} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Platform %
                    </label>
                    <input type="number" min="0" max="100" value={globalSettings.platformPercentage}
                      onChange={(e) => {
                        const p = parseInt(e.target.value) || 0;
                        setGlobalSettings({ ...globalSettings, platformPercentage: p, instructorPercentage: 100 - p });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Instructor %
                    </label>
                    <input type="number" min="0" max="100" value={globalSettings.instructorPercentage}
                      onChange={(e) => {
                        const i = parseInt(e.target.value) || 0;
                        setGlobalSettings({ ...globalSettings, instructorPercentage: i, platformPercentage: 100 - i });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      required />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setShowGlobalSettings(false)}
                    className={`px-6 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || globalSettings.platformPercentage + globalSettings.instructorPercentage !== 100}
                    className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating & Sending PDFs...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Update & Send to Instructors</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorEarningsManagement;
