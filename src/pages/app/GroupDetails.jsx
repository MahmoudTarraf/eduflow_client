import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, DollarSign, FileText, Video, Rocket, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { formatPrice, priceToCents, centsToPrice } from '../../utils/currency';

const GroupDetails = () => {
  const { courseId, groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [group, setGroup] = useState(null);
  const [sections, setSections] = useState([]);
  const [studentsProgress, setStudentsProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    isFree: true,
    priceSYR: 0,
    order: 0
  });
  const [creating, setCreating] = useState(false);
  const [requestingSectionDeleteId, setRequestingSectionDeleteId] = useState(null);
  const [pendingSectionDeleteIds, setPendingSectionDeleteIds] = useState([]);
  const [deleteSectionModal, setDeleteSectionModal] = useState({
    open: false,
    section: null,
    reason: '',
    submitting: false
  });

  const fetchGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch group details
      const groupRes = await axios.get(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(groupRes.data.group);
      
      // Fetch sections
      const sectionsRes = await axios.get(`/api/groups/${groupId}/sections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(sectionsRes.data.data || []);
      
      // Fetch students progress (instructor/admin only)
      if (user?.role === 'admin' || user?.role === 'instructor') {
        try {
          const progressRes = await axios.get(`/api/groups/${groupId}/students/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStudentsProgress(progressRes.data.data || []);
        } catch (err) {
          console.log('Could not fetch progress:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error(error.response?.data?.message || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.role]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`/api/groups/${groupId}/sections`, sectionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Section created successfully!');
      setShowCreateSection(false);
      setSectionForm({
        name: '',
        description: '',
        isFree: true,
        priceSYR: 0,
        order: 0
      });
      fetchGroupData();
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error(error.response?.data?.message || 'Failed to create section');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSection = async (sectionId, sectionName) => {
    if (!window.confirm(`Delete section "${sectionName}"? This will delete all content and files.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Section deleted successfully');
      fetchGroupData();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const openDeleteSectionModal = (section) => {
    if (!section) return;
    setDeleteSectionModal({ open: true, section, reason: '', submitting: false });
  };

  const handleRequestDeleteSection = async (section) => {
    if (!section) return;

    const trimmed = (deleteSectionModal.reason || '').trim();
    if (trimmed.length < 20) {
      toast.error('Please provide a detailed reason (at least 20 characters).');
      return;
    }

    try {
      setRequestingSectionDeleteId(section._id);
      setDeleteSectionModal((prev) => ({ ...prev, submitting: true }));
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/sections/${section._id}/request-delete`,
        { reason: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        res.data?.message ||
        'Delete request submitted to admin. They must approve before this section can be deleted.'
      );
      setPendingSectionDeleteIds((prev) =>
        prev.includes(section._id) ? prev : [...prev, section._id]
      );
      setDeleteSectionModal({ open: false, section: null, reason: '', submitting: false });
    } catch (error) {
      console.error('Error requesting section delete:', error);
      const message = error.response?.data?.message || 'Failed to submit delete request';

      if (
        error.response?.status === 400 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('already a pending delete request')
      ) {
        setPendingSectionDeleteIds((prev) =>
          prev.includes(section._id) ? prev : [...prev, section._id]
        );
        setDeleteSectionModal({ open: false, section: null, reason: '', submitting: false });
      }

      toast.error(message);
    } finally {
      setRequestingSectionDeleteId(null);
      setDeleteSectionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleManageContent = (sectionId) => {
    navigate(`/app/sections/${sectionId}/content`);
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/app/courses/${courseId}/groups`)}
            className={`mb-4 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Groups
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {group?.name}
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {group?.description || 'Manage sections and students'}
              </p>
            </div>
            
            {(user?.role === 'admin' || user?.role === 'instructor') && (
              <button
                onClick={() => setShowCreateSection(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Section
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections List */}
          <div className="lg:col-span-2">
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              Sections
            </h2>
            
            {sections.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 text-center`}>
                <FileText className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No sections created yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <motion.div
                    key={section._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {section.name}
                          </h3>
                          
                          {section.isFree ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Unlock className="w-3 h-3 mr-1" />
                              Free
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Lock className="w-3 h-3 mr-1" />
                              {formatPrice(section.priceCents || 0, section.currency || 'SYR')}
                            </span>
                          )}
                        </div>
                        
                        {section.description && (
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {section.description}
                          </p>
                        )}
                      </div>
                      
                      {(user?.role === 'admin' || user?.role === 'instructor') && (
                        user?.role === 'admin' ? (
                          <button
                            onClick={() => handleDeleteSection(section._id, section.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openDeleteSectionModal(section)}
                            disabled={
                              requestingSectionDeleteId === section._id ||
                              pendingSectionDeleteIds.includes(section._id)
                            }
                            className="btn-request-delete"
                          >
                            {requestingSectionDeleteId === section._id
                              ? 'Requesting...'
                              : pendingSectionDeleteIds.includes(section._id)
                                ? 'Request Pending'
                                : 'Request Delete'}
                          </button>
                        )
                      )}
                    </div>

                    {/* Content Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Video className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm">{section.lectureCount || 0} Lectures</span>
                      </div>
                      <div className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FileText className="w-4 h-4 mr-2 text-green-500" />
                        <span className="text-sm">{section.assignmentCount || 0} Assignments</span>
                      </div>
                      <div className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Rocket className="w-4 h-4 mr-2 text-purple-500" />
                        <span className="text-sm">{section.projectCount || 0} Projects</span>
                      </div>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'instructor') && (
                      <button
                        onClick={() => handleManageContent(section._id)}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                      >
                        Manage Content
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Students Progress Sidebar */}
          <div>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              Students
            </h2>
            
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              {studentsProgress.length === 0 ? (
                <div className="text-center py-8">
                  <Users className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    No students enrolled
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentsProgress.map((studentData) => (
                    <div key={studentData.student._id} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {studentData.student.name}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {studentData.student.email}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          studentData.enrollmentStatus === 'enrolled'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {studentData.enrollmentStatus}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Progress
                          </span>
                          <span className={`text-xs font-medium ${
                            studentData.progressPercentage === 100
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {studentData.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              studentData.progressPercentage === 100
                                ? 'bg-green-600'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${studentData.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Payment Info */}
                      <div className={`flex items-center justify-between text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>Paid: {studentData.amountPaidSYR || 0} SYR</span>
                        </div>
                        <div>
                          {studentData.completedItems}/{studentData.totalItems} items
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Section Modal */}
        {showCreateSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
            >
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                Create New Section
              </h3>

              <form onSubmit={handleCreateSection} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Description
                  </label>
                  <textarea
                    rows="2"
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={sectionForm.isFree}
                    onChange={(e) => setSectionForm({ ...sectionForm, isFree: e.target.checked, price: e.target.checked ? 0 : sectionForm.price })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isFree" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Free Section
                  </label>
                </div>

                {!sectionForm.isFree && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Price (SYR) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required={!sectionForm.isFree}
                      value={sectionForm.price}
                      onChange={(e) => setSectionForm({ ...sectionForm, price: Number(e.target.value) })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSection(false)}
                    className={`px-6 py-2 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deleteSectionModal.open && deleteSectionModal.section && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
            >
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Request Section Delete
              </h3>
              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                You cannot delete sections directly. This will send a delete request to the admin. No data will be
                deleted until an admin approves.
              </p>
              <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Section: {deleteSectionModal.section.name}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (deleteSectionModal.section) {
                    handleRequestDeleteSection(deleteSectionModal.section);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for deletion * (min 20 characters)
                  </label>
                  <textarea
                    rows={4}
                    value={deleteSectionModal.reason}
                    onChange={(e) => setDeleteSectionModal((prev) => ({ ...prev, reason: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-md border ${
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-gray-100'
                        : 'border-gray-300 bg-white text-gray-900'
                    } text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Explain why this section should be permanently deleted..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {deleteSectionModal.reason.trim().length} / 20
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteSectionModal({ open: false, section: null, reason: '', submitting: false })}
                    disabled={deleteSectionModal.submitting}
                    className={`px-4 py-2 rounded-md border text-sm ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      deleteSectionModal.submitting || deleteSectionModal.reason.trim().length < 20
                    }
                    className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteSectionModal.submitting ? 'Submitting...' : 'Submit Request'}
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

export default GroupDetails;
