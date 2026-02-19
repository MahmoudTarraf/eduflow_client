import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, priceToCents, centsToPrice } from '../../utils/currency';
import toast from 'react-hot-toast';

const GroupSections = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isFree: true,
    price: 0,
    currency: 'SYR',
    order: 0
  });
  const [requestingSectionDeleteId, setRequestingSectionDeleteId] = useState(null);

  const getApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const fieldMessages = data.errors
        .map((err) => err.msg || err.message)
        .filter(Boolean);

      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ');
      }
    }

    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }

    return fallbackMessage;
  };
  const [pendingSectionDeleteIds, setPendingSectionDeleteIds] = useState([]);
  const [deleteSectionModal, setDeleteSectionModal] = useState({
    open: false,
    section: null,
    reason: '',
    submitting: false
  });

  useEffect(() => {
    fetchGroupAndSections();
  }, [groupId]);

  const fetchGroupAndSections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch group details
      const groupRes = await axios.get(
        `/api/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(groupRes.data.group);

      // Fetch sections for this group
      const sectionsRes = await axios.get(
        `/api/sections/group/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(sectionsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      const message = getApiErrorMessage(error, 'Failed to fetch data');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    
    // Validate price against course total
    if (!formData.isFree && group?.course) {
      const sectionPriceCents = priceToCents(formData.price);
      const courseTotalCents = Number(
        group.course.totalPriceCents ||
        ((group.course.totalCostSYR || group.course.totalPrice || group.course.cost || 0) * 100)
      );

      if (sectionPriceCents > courseTotalCents) {
        toast.error(
          `Section price (${formatPrice(
            sectionPriceCents,
            formData.currency
          )}) cannot exceed the course total price (${formatPrice(courseTotalCents, formData.currency)})`
        );
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/sections`,
        {
          name: formData.name,
          description: formData.description,
          groupId: groupId,
          courseId: group.course._id,
          isFree: formData.isFree,
          priceCents: formData.isFree ? 0 : priceToCents(formData.price),
          currency: formData.currency,
          order: formData.order
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isFree: true, price: 0, currency: 'SYR', order: 0 });
      fetchGroupAndSections();
      toast.success('Section created successfully!');
    } catch (error) {
      console.error('Error creating section:', error);
      const message = getApiErrorMessage(error, 'Failed to create section');
      toast.error(message);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      description: section.description || '',
      isFree: section.isFree,
      price: centsToPrice(section.priceCents || 0),
      currency: section.currency || 'SYR',
      order: section.order
    });
    setShowCreateModal(true);
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    
    // Validate price against course total
    if (!formData.isFree && (group?.course?.totalPriceCents || group?.course?.totalPrice)) {
      const sectionPriceCents = priceToCents(formData.price);
      const courseTotal = Number(group.course.totalPriceCents || group.course.totalPrice * 100 || 0);
      
      if (sectionPriceCents > courseTotal) {
        toast.error(
          `Section price (${formatPrice(
            sectionPriceCents,
            formData.currency
          )}) cannot exceed the course total price (${formatPrice(courseTotal, formData.currency)})`
        );
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/sections/${editingSection._id}`,
        {
          name: formData.name,
          description: formData.description,
          isFree: formData.isFree,
          priceCents: formData.isFree ? 0 : priceToCents(formData.price),
          currency: formData.currency,
          order: formData.order
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setEditingSection(null);
      setFormData({ name: '', description: '', isFree: true, price: 0, currency: 'SYR', order: 0 });
      fetchGroupAndSections();
      toast.success('Section updated successfully!');
    } catch (error) {
      console.error('Error updating section:', error);
      const message = getApiErrorMessage(error, 'Failed to update section');
      toast.error(message);
    }
  };

  const handleDeleteSection = async (sectionId, sectionName) => {
    if (!window.confirm(`Are you sure you want to delete section "${sectionName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/sections/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchGroupAndSections();
      toast.success('Section deleted successfully!');
    } catch (error) {
      console.error('Error deleting section:', error);
      const message = getApiErrorMessage(error, 'Failed to delete section');
      toast.error(message);
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

      setPendingSectionDeleteIds((prev) =>
        prev.includes(section._id) ? prev : [...prev, section._id]
      );
      setDeleteSectionModal({ open: false, section: null, reason: '', submitting: false });
      toast.success(
        res.data?.message ||
          'Delete request submitted to admin. They must approve before this section can be deleted.'
      );
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
    navigate(`/instructor/sections/${sectionId}/content`);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSection(null);
    setFormData({ name: '', description: '', isFree: true, price: 0, currency: 'SYR', order: 0 });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/instructor/courses/${group?.course._id}/groups`)}
            className={`mb-4 flex items-center ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Groups
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{group?.name} - Sections</h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Course: {group?.course?.name}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 border border-indigo-200 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Section
            </button>
          </div>
        </div>

        {/* Course Price Info */}
        {group?.course && (
          <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
              <strong>Course Total Price:</strong> {formatPrice(
                (group.course.totalPriceCents) || ((group.course.totalCostSYR || group.course.totalPrice || group.course.cost || 0) * 100) || 0,
                group.course.currency || 'SYR'
              )}
            </p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              The sum of all paid sections cannot exceed this amount.
            </p>
          </div>
        )}

        {/* Sections List */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
          {sections.length === 0 ? (
            <div className="p-8 text-center">
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No sections created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`mt-4 font-medium ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                Create your first section
              </button>
            </div>
          ) : (
            <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {sections.map((section) => (
                <div key={section._id} className={`p-6 transition ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{section.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          section.isFree
                            ? (theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                            : (theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                        }`}>
                          {section.isFree ? '✅ Free' : `💰 ${formatPrice(section.priceCents || 0, section.currency || 'SYR')}`}
                        </span>
                      </div>
                      {section.description && (
                        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{section.description}</p>
                      )}
                      <div className={`mt-3 flex items-center space-x-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>📹 {section.contentCounts?.lectures || 0} Lectures</span>
                        <span>📝 {section.contentCounts?.assignments || 0} Assignments</span>
                        <span>🚀 {section.contentCounts?.projects || 0} Projects</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleManageContent(section._id)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 border border-indigo-200 transition"
                      >
                        Manage Content
                      </button>
                      <button
                        onClick={() => handleEditSection(section)}
                        className={`p-2 rounded-md transition ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`}
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {user?.role === 'admin' ? (
                        <button
                          onClick={() => handleDeleteSection(section._id, section.name)}
                          className={`p-2 rounded-md transition ${
                            theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                          }`}
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {editingSection ? 'Edit Section' : 'Create New Section'}
                  </h2>
                  <button onClick={closeModal} className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingSection ? handleUpdateSection : handleCreateSection}>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Section Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="input-field w-full"
                        placeholder="e.g., Introduction to Python"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="input-field w-full"
                        placeholder="Brief description of this section..."
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="isFree"
                        checked={formData.isFree}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        This section is free
                      </label>
                    </div>

                    {!formData.isFree && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Price (SYR) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          required={!formData.isFree}
                          className="input-field w-full"
                          placeholder="6000.00"
                        />
                        {(group?.course) && (
                          <p className="mt-1 text-xs text-gray-500">
                            Maximum: {formatPrice(
                              (group.course.totalPriceCents) || ((group.course.totalCostSYR || group.course.totalPrice || group.course.cost || 0) * 100) || 0,
                              group.course.currency || 'SYR'
                            )} (Course Total)
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Order
                      </label>
                      <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        min="0"
                        className="input-field w-full"
                        placeholder="0"
                      />
                      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Lower numbers appear first</p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`px-6 py-2 border rounded-md transition ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 border border-indigo-200 transition"
                    >
                      {editingSection ? 'Update Section' : 'Create Section'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {deleteSectionModal.open && deleteSectionModal.section && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-lg w-full`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Request Section Delete
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You cannot delete sections directly. This will send a delete request to the admin. No data will be
                    deleted until an admin approves.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteSectionModal({ open: false, section: null, reason: '', submitting: false })}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (deleteSectionModal.section) {
                    handleRequestDeleteSection(deleteSectionModal.section);
                  }
                }}
                className="px-6 py-4 space-y-4"
              >
                <div>
                  <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Section: <span className="font-semibold">{deleteSectionModal.section.name}</span>
                  </p>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for deletion * (min 20 characters)
                  </label>
                  <textarea
                    rows={4}
                    value={deleteSectionModal.reason}
                    onChange={(e) =>
                      setDeleteSectionModal((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSections;
