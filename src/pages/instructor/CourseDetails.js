import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { isInstructorRestricted } from '../../utils/restrictions';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Users, 
  BookOpen, 
  DollarSign,
  Calendar,
  Plus
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const cannotEditCourse = isInstructorRestricted(user, 'createEditDeleteCourses');
  const cannotManageDiscounts = isInstructorRestricted(user, 'createDisableDiscounts');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: 4,
    cost: 0,
    image: '',
    hasCertificate: false,
    certificateMode: 'automatic',
    instructorCertificateRelease: false,
    telegramGroupLink: '',
    allowRatingAfterCompletion: true,
    allowPointsDiscount: true
  });
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [showCostConfirmModal, setShowCostConfirmModal] = useState(false);
  const [pendingCostChange, setPendingCostChange] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [addingLevel, setAddingLevel] = useState(false);
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    discountPrice: 0,
    timerDays: 7
  });
  const [requestingDiscount, setRequestingDiscount] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [hasPendingDeleteRequest, setHasPendingDeleteRequest] = useState(false);
  const [deleteRequestModal, setDeleteRequestModal] = useState({
    open: false,
    reason: '',
    submitting: false
  });

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

  useEffect(() => {
    fetchCourse();
    fetchCategories();
    fetchLevels();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const fetchedCategories = response.data.categories || [];
      console.log('Fetched categories:', fetchedCategories);
      setCategories(fetchedCategories);
      
      // If no categories were returned, retry once after a short delay
      if (fetchedCategories.length === 0) {
        console.log('No categories found, retrying...');
        setTimeout(async () => {
          try {
            const retryResponse = await axios.get('/api/categories');
            console.log('Retry fetched categories:', retryResponse.data.categories);
            setCategories(retryResponse.data.categories || []);
          } catch (retryError) {
            console.error('Retry fetch categories error:', retryError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories. Please refresh the page.');
    }
  };

  const handleArchiveToggle = async () => {
    if (!course) return;

    if (cannotEditCourse) {
      toast.error('Your instructor account is suspended. You cannot archive or unarchive courses right now.');
      return;
    }

    try {
      setArchiving(true);
      const res = await axios.patch(`/api/courses/${id}/archive`, {
        archive: !course.isArchived
      });
      setCourse(res.data.course);
      toast.success(res.data.message || (res.data.course.isArchived ? 'Course archived' : 'Course unarchived'));
      try { window.dispatchEvent(new CustomEvent('courses:updated')); } catch (e) {}
    } catch (error) {
      console.error('Archive toggle error:', error);
      const message = getApiErrorMessage(error, 'Failed to update archive status');
      toast.error(message);
    } finally {
      setArchiving(false);
    }
  };

  const handleRequestDelete = () => {
    if (!course) return;

    if (cannotEditCourse) {
      toast.error('Your instructor account is suspended. You cannot request course deletion right now.');
      return;
    }

    setDeleteRequestModal({
      open: true,
      reason: '',
      submitting: false
    });
  };

  const handleSubmitDeleteRequest = async (e) => {
    e?.preventDefault?.();
    if (!course) return;

    const reason = (deleteRequestModal.reason || '').trim();
    if (reason.length < 20) {
      toast.error('Please provide a detailed reason (at least 20 characters).');
      return;
    }

    try {
      setDeleteRequestModal((prev) => ({ ...prev, submitting: true }));
      setRequestingDelete(true);
      const res = await axios.post(`/api/courses/${id}/request-delete`, { reason });
      toast.success(res.data?.message || 'Delete request submitted to admin.');
      setHasPendingDeleteRequest(true);
      setDeleteRequestModal({ open: false, reason: '', submitting: false });
    } catch (error) {
      console.error('Request delete course error:', error);
      const message = error.response?.data?.message || 'Failed to request course deletion';

      if (
        error.response?.status === 400 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('already a pending delete request')
      ) {
        setHasPendingDeleteRequest(true);
        setDeleteRequestModal({ open: false, reason: '', submitting: false });
      }

      toast.error(message);
    } finally {
      setRequestingDelete(false);
      setDeleteRequestModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/courses/${id}`);
      toast.success('Course deleted successfully');
      navigate('/instructor');
    } catch (error) {
      console.error('Delete course error:', error);
      const message = getApiErrorMessage(error, 'Failed to delete course');
      toast.error(message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setAddingCategory(true);
      const response = await axios.post('/api/categories', {
        name: newCategoryName,
        description: `${newCategoryName} courses`
      });
      
      await fetchCategories();
      setForm({ ...form, category: response.data.category.slug });
      setNewCategoryName('');
      setShowAddCategory(false);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      const message = getApiErrorMessage(error, 'Failed to add category');
      toast.error(message);
    } finally {
      setAddingCategory(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get('/api/levels');
      const fetchedLevels = response.data.levels || [];
      console.log('Fetched levels:', fetchedLevels);
      setLevels(fetchedLevels);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim()) {
      toast.error('Please enter a level name');
      return;
    }

    try {
      setAddingLevel(true);
      const response = await axios.post('/api/levels', {
        name: newLevelName,
        description: `${newLevelName} level courses`,
        order: levels.length + 1
      });
      
      await fetchLevels();
      setForm({ ...form, level: response.data.level.slug });
      setNewLevelName('');
      setShowAddLevel(false);
      toast.success('Level added successfully!');
    } catch (error) {
      console.error('Error adding level:', error);
      const message = getApiErrorMessage(error, 'Failed to add level');
      toast.error(message);
    } finally {
      setAddingLevel(false);
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      const courseData = response.data.course;
      setCourse(courseData);
      setForm({
        name: courseData.name || '',
        description: courseData.description || '',
        category: courseData.category || '',
        level: courseData.level || 'beginner',
        duration: courseData.duration || 4,
        cost: courseData.cost || 0,
        image: courseData.image || '',
        hasCertificate: courseData.offersCertificate !== undefined ? courseData.offersCertificate : true,
        certificateMode: courseData.certificateMode || 'automatic',
        instructorCertificateRelease: courseData.instructorCertificateRelease || false,
        telegramGroupLink: courseData.telegramGroupLink || '',
        allowRatingAfterCompletion: courseData.allowRatingAfterCompletion !== undefined ? courseData.allowRatingAfterCompletion : true,
        allowPointsDiscount: courseData.allowPointsDiscount !== undefined ? courseData.allowPointsDiscount : true
      });
      
      // Set discount form if discount exists
      if (courseData.discount && courseData.discount.status !== 'disabled') {
        setEnableDiscount(courseData.discount.status === 'pending' || courseData.discount.status === 'approved');
        setDiscountForm({
          discountPrice: courseData.discount.price || 0,
          timerDays: courseData.discount.timerDays || 7
        });
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (cannotEditCourse) {
      toast.error('Your instructor account is suspended. You cannot edit courses right now.');
      return;
    }

    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(`/api/courses/${id}`, form);
      
      // Check if confirmation is required for cost change
      if (response.data.confirmationRequired) {
        setPendingCostChange(response.data);
        setShowCostConfirmModal(true);
        setSaving(false);
        return;
      }
      
      await fetchCourse();
      setEditing(false);
      toast.success('Course updated successfully!');
      try { window.dispatchEvent(new CustomEvent('courses:updated')); } catch (e) {}
    } catch (error) {
      console.error('Update course error:', error);
      const message = getApiErrorMessage(error, 'Failed to update course');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAutoAdjust = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/courses/cost-change/${pendingCostChange.pendingChangeId}/confirm-auto`);
      setShowCostConfirmModal(false);
      setPendingCostChange(null);
      await fetchCourse();
      setEditing(false);
      toast.success('Course cost updated and section prices adjusted!');
      try { window.dispatchEvent(new CustomEvent('courses:updated')); } catch (e) {}
    } catch (error) {
      console.error('Confirm auto-adjust error:', error);
      const message = getApiErrorMessage(error, 'Failed to confirm cost change');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCostChange = async () => {
    try {
      await axios.post(`/api/courses/cost-change/${pendingCostChange.pendingChangeId}/cancel`);
      setShowCostConfirmModal(false);
      setPendingCostChange(null);
      // Revert form cost to original
      setForm(prev => ({ ...prev, cost: course.cost }));
    } catch (error) {
      console.error('Cancel cost change error:', error);
      toast.error('Failed to cancel cost change');
    }
  };

  const handleRequestDiscount = async () => {
    if (cannotManageDiscounts) {
      toast.error('Your instructor account is suspended. You cannot request discounts right now.');
      return;
    }

    if (!discountForm.discountPrice || discountForm.discountPrice >= form.cost) {
      toast.error('Discount price must be less than current course price');
      return;
    }

    try {
      setRequestingDiscount(true);
      await axios.post(`/api/courses/${id}/discount/request`, {
        discountPrice: discountForm.discountPrice,
        timerDays: discountForm.timerDays
      });
      toast.success('Discount request submitted successfully!');
      await fetchCourse();
      try { window.dispatchEvent(new CustomEvent('courses:updated')); } catch (e) {}
    } catch (error) {
      console.error('Request discount error:', error);
      const message = getApiErrorMessage(error, 'Failed to request discount');
      toast.error(message);
    } finally {
      setRequestingDiscount(false);
    }
  };

  const handleDisableDiscount = async () => {
    if (cannotManageDiscounts) {
      toast.error('Your instructor account is suspended. You cannot disable discounts right now.');
      return;
    }

    if (!window.confirm('Are you sure you want to disable this discount?')) return;

    try {
      await axios.put(`/api/courses/${id}/discount/disable`);
      toast.success('Discount disabled successfully');
      await fetchCourse();
      setEnableDiscount(false);
      try { window.dispatchEvent(new CustomEvent('courses:updated')); } catch (e) {}
    } catch (error) {
      console.error('Disable discount error:', error);
      const message = getApiErrorMessage(error, 'Failed to disable discount');
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Course Not Found</h2>
          <Link to="/instructor" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/instructor" className={`inline-flex items-center gap-2 mb-4 ${theme === 'dark' ? 'text-gray-400 hover:text-indigo-300' : 'text-gray-600 hover:text-indigo-600'}`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {editing ? 'Edit Course' : 'Course Details'}
            </h1>
            {!editing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (cannotEditCourse) {
                      toast.error('Your instructor account is suspended. You cannot edit courses right now.');
                      return;
                    }
                    setEditing(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                  disabled={user?.instructorStatus !== 'approved' || cannotEditCourse}
                >
                  <Edit className="w-4 h-4" />
                  Edit Course
                </button>
                <button
                  type="button"
                  onClick={handleArchiveToggle}
                  disabled={archiving}
                  className={`px-3 py-2 rounded-md border ${course?.isArchived ? 'border-green-300 text-green-700 bg-green-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'}`}
                >
                  {archiving ? 'Updating...' : (course?.isArchived ? 'Unarchive' : 'Archive')}
                </button>
                {user?.role === 'instructor' && (
                  <button
                    type="button"
                    onClick={handleRequestDelete}
                    disabled={requestingDelete || hasPendingDeleteRequest}
                    className="btn-request-delete"
                  >
                    {requestingDelete
                      ? 'Requesting...'
                      : hasPendingDeleteRequest
                        ? 'Request Pending'
                        : 'Request Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Course Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {editing ? (
            <div className="card">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Course Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      minLength={2}
                    />
                  </div>

                  <div>
                    <label className="label">Category *</label>
                    <div className="flex gap-2">
                      <select
                        className="input-field flex-1"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        title="Add new category"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {showAddCategory && (
                      <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field flex-1"
                            placeholder="Enter new category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={addingCategory}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {addingCategory ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Level *</label>
                    <div className="flex gap-2">
                      <select
                        className="input-field flex-1"
                        value={showAddLevel ? '__add_new__' : form.level}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setShowAddLevel(true);
                          } else {
                            setForm({ ...form, level: e.target.value });
                            setShowAddLevel(false);
                          }
                        }}
                      >
                        {levels.map(level => (
                          <option key={level._id} value={level.slug}>
                            {level.name}
                          </option>
                        ))}
                        <option value="__add_new__">+ Add New Level</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddLevel(!showAddLevel)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        title="Add new level"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {showAddLevel && (
                      <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field flex-1"
                            placeholder="Enter new level name (e.g., Expert, Master)"
                            value={newLevelName}
                            onChange={(e) => setNewLevelName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddLevel()}
                          />
                          <button
                            type="button"
                            onClick={handleAddLevel}
                            disabled={addingLevel}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {addingLevel ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddLevel(false);
                              setNewLevelName('');
                            }}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Duration (weeks) *</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Cost (SYR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Description * (min 10 characters)</label>
                  <textarea
                    className="input-field"
                    rows="5"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    minLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">{form.description.length} characters</p>
                </div>

                <div>
                  <label className="label">Image URL (optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="hasCertificate"
                      checked={form.hasCertificate}
                      onChange={(e) => {
                        const hasCert = e.target.checked;
                        setForm({
                          ...form,
                          hasCertificate: hasCert,
                          certificateMode: hasCert ? form.certificateMode || 'automatic' : 'disabled',
                          instructorCertificateRelease: hasCert ? form.instructorCertificateRelease : false
                        });
                      }}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasCertificate" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        This course offers a certificate upon completion
                      </span>
                      <span className="block text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        ⚠️ <strong>Important:</strong> You must provide a certificate to students who complete all course requirements if you enable this option.
                      </span>
                    </label>
                  </div>

                  {form.hasCertificate && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="label">Certificate Mode</label>
                        <select
                          className="input-field w-full"
                          value={form.certificateMode}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setForm({
                              ...form,
                              certificateMode: mode,
                              instructorCertificateRelease: mode === 'manual_instructor' ? form.instructorCertificateRelease : false
                            });
                          }}
                        >
                          <option value="automatic">Automatic (after 100% progress)</option>
                          <option value="manual_instructor">Manual instructor release</option>
                        </select>
                      </div>

                      {form.certificateMode === 'manual_instructor' && (
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="instructorCertificateRelease"
                            checked={form.instructorCertificateRelease}
                            onChange={(e) => setForm({ ...form, instructorCertificateRelease: e.target.checked })}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="instructorCertificateRelease" className="ml-3 flex-1">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">
                              Allow students to request certificates now
                            </span>
                            <span className="block text-xs text-gray-600 dark:text-gray-300 mt-1">
                              When enabled, enrolled students who meet the course requirements will be able to request a certificate.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="allowRatingAfterCompletion"
                      checked={form.allowRatingAfterCompletion}
                      onChange={(e) => setForm({ ...form, allowRatingAfterCompletion: e.target.checked })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowRatingAfterCompletion" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        Allow students to rate this course after completion
                      </span>
                      <span className="block text-xs text-blue-800 dark:text-blue-200 mt-1">
                        When enabled, students who complete the course with a passing grade will see a single rating prompt on their dashboard and certificates page.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="allowPointsDiscount"
                      checked={form.allowPointsDiscount}
                      onChange={(e) => setForm({ ...form, allowPointsDiscount: e.target.checked })}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowPointsDiscount" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        Supports Points Discount
                      </span>
                      <span className="block text-xs text-green-800 dark:text-green-200 mt-1">
                        💰 If enabled, students can use their reward balance to reduce payment. For example, each 500 points = 10,000 SYP (based on admin settings). The discount will be shared proportionally between you and the platform based on your revenue split. If you turn this off, any wallet discounts will only reduce the platform's share — <strong>your earnings stay based on the full price.</strong>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Telegram Group Link */}
                <div>
                  <label className="label">Telegram Discussion Group Link (Optional)</label>
                  <input
                    type="url"
                    className="input-field"
                    value={form.telegramGroupLink}
                    onChange={(e) => setForm({ ...form, telegramGroupLink: e.target.value })}
                    placeholder="https://t.me/yourgroup"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    💡 <strong>Tip:</strong> Name your Telegram group as "<em>{course.name || 'Course Name'} - Group Name</em>" for clarity.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        name: course.name || '',
                        description: course.description || '',
                        category: course.category || 'programming',
                        level: course.level || 'beginner',
                        duration: course.duration || 4,
                        cost: course.cost || 0,
                        image: course.image || '',
                        hasCertificate: course.offersCertificate !== undefined ? course.offersCertificate : true,
                        certificateMode: course.certificateMode || 'automatic',
                        instructorCertificateRelease: course.instructorCertificateRelease || false,
                        telegramGroupLink: course.telegramGroupLink || '',
                        allowRatingAfterCompletion: course.allowRatingAfterCompletion !== undefined ? course.allowRatingAfterCompletion : true,
                        allowPointsDiscount: course.allowPointsDiscount !== undefined ? course.allowPointsDiscount : true
                      });
                    }}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card">
                  <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {course.name}
                  </h2>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {course.description}
                  </p>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <BookOpen className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} capitalize`}>{course.category}</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <Users className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Level</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{course.level}</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <Calendar className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{course.duration} weeks</p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <DollarSign className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Price</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {course.totalPrice ? `${course.totalPrice} SYP` : `$${course.cost}`}
                      </p>
                    </div>
                </div>

                {/* Groups Section */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Groups</h3>
                    <Link
                      to={`/instructor/courses/${course._id}/groups`}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Manage Groups
                    </Link>
                  </div>

                  {course.groups && course.groups.length > 0 ? (
                    <div className="space-y-3">
                      {course.groups.map((group) => (
                        <div
                          key={group._id}
                          className={`p-4 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}
                        >
                          <div>
                            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{group.name}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {Array.isArray(group.students)
                                ? group.students.filter((s) => s.status === 'enrolled' && s.student && s.student._id).length
                                : (group.currentStudents || 0)}{' '}
                              / {group.maxStudents} students
                            </p>
                          </div>
                          <Link
                            to={`/instructor/groups/${group._id}/sections`}
                            className="btn-secondary"
                          >
                            View Sections
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      No groups yet. Create your first group to start enrolling students.
                    </p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Discount Management Card - Only for approved courses */}
                {course?.approvalStatus === 'approved' && (
                  <div className="card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-700">
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      🔥 Discount Management
                    </h3>
                    
                    {course?.discount?.status === 'pending' && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                        ⏳ Your discount request is pending admin approval
                      </div>
                    )}
                    
                    {course?.discount?.status === 'approved' && (
                      <div className="space-y-3 mb-4">
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                          ✅ Discount Active!
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>Discount:</strong> {course.discount.percentage}% OFF
                          </p>
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>Price:</strong> {course.discount.price} SYR
                          </p>
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>Ends:</strong> {new Date(course.discount.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={handleDisableDiscount}
                          className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Disable Discount
                        </button>
                      </div>
                    )}
                    
                    {course?.discount?.status === 'rejected' && (
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 text-sm text-red-800 dark:text-red-200 mb-4">
                        ❌ Rejected: {course.discount.reasonReject}
                      </div>
                    )}
                    
                    {(!course?.discount || course?.discount?.status === 'disabled' || course?.discount?.status === 'rejected') && (
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <input 
                            type="checkbox" 
                            id="enableDiscountStandalone"
                            checked={enableDiscount}
                            onChange={(e) => setEnableDiscount(e.target.checked)}
                            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="enableDiscountStandalone" className="ml-3 flex-1">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">
                              Enable Discount
                            </span>
                            <span className="block text-xs text-red-800 dark:text-red-200 mt-1">
                              Create limited-time offer
                            </span>
                          </label>
                        </div>
                        
                        {enableDiscount && (
                          <div className="space-y-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div>
                              <label className="block text-xs font-medium mb-1">Discount Price (SYR)</label>
                              <input
                                type="number"
                                min="0"
                                max={course.cost}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                value={discountForm.discountPrice}
                                onChange={(e) => setDiscountForm({ ...discountForm, discountPrice: Number(e.target.value) })}
                                placeholder="Enter price"
                              />
                              {discountForm.discountPrice > 0 && course.cost > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  {Math.round(((course.cost - discountForm.discountPrice) / course.cost) * 100)}% discount
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium mb-1">Duration (Days)</label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                value={discountForm.timerDays}
                                onChange={(e) => setDiscountForm({ ...discountForm, timerDays: Number(e.target.value) })}
                              />
                            </div>
                            
                            <button
                              onClick={handleRequestDiscount}
                              disabled={requestingDiscount || !discountForm.discountPrice || discountForm.discountPrice >= course.cost}
                              className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-md hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                            >
                              {requestingDiscount ? 'Submitting...' : 'Request Approval'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cost Change Confirmation Modal */}
      {showCostConfirmModal && pendingCostChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ⚠️ Course Cost Change Requires Confirmation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {pendingCostChange.message}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Current Situation:
              </h3>
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• <strong>Old Cost:</strong> {pendingCostChange.data.oldCost.toLocaleString()} {pendingCostChange.data.currency}</li>
                <li>• <strong>New Cost:</strong> {pendingCostChange.data.newCost.toLocaleString()} {pendingCostChange.data.currency}</li>
                <li>• <strong>Total Paid Sections:</strong> {pendingCostChange.data.totalPaidSections.toLocaleString()} {pendingCostChange.data.currency}</li>
                <li>• <strong>Scale Factor:</strong> {pendingCostChange.data.scaleFactor}</li>
              </ul>
            </div>

            {pendingCostChange.data.affectedSections?.length > 0 && (
              <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 px-3 pt-3 sticky top-0 bg-white dark:bg-gray-800">
                  Section Price Adjustments ({pendingCostChange.data.affectedSections.length} sections):
                </h3>
                <div className="space-y-2 px-3 pb-3">
                  {pendingCostChange.data.affectedSections.map((section, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {section.sectionName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {section.oldPrice.toLocaleString()} → {section.newPrice.toLocaleString()} {pendingCostChange.data.currency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                How would you like to proceed?
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleConfirmAutoAdjust}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-left"
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="font-semibold">✅ Adjust Section Prices Automatically</p>
                      <p className="text-sm text-indigo-100">Section prices will be reduced proportionally ({pendingCostChange.data.scaleFactor})</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowCostConfirmModal(false);
                    toast('Please manually adjust section prices in the Groups → Sections page, then try updating the course cost again.');
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-left"
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="font-semibold">🔧 Set Section Prices Manually</p>
                      <p className="text-sm text-blue-100">Go to sections page to adjust prices individually</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleCancelCostChange}
                  className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-left"
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="font-semibold">❌ Cancel Cost Change</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Keep the current course cost ({pendingCostChange.data.oldCost.toLocaleString()} {pendingCostChange.data.currency})</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ℹ️ Admin has been notified of this pending change
            </p>
          </div>
        </div>
      )}

      {deleteRequestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Request Course Delete
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will send a delete request to the admin. No data will be deleted until an admin approves. Once
                  approved, deletion is permanent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteRequestModal({ open: false, reason: '', submitting: false })}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeleteRequest} className="px-6 py-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason for deletion * (min 20 characters)
                </label>
                <textarea
                  rows={4}
                  value={deleteRequestModal.reason}
                  onChange={(e) =>
                    setDeleteRequestModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Explain why this course should be permanently deleted..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {deleteRequestModal.reason.trim().length} / 20
                </p>
              </div>

              <div className="px-0 py-0 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteRequestModal({ open: false, reason: '', submitting: false })}
                  disabled={deleteRequestModal.submitting}
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteRequestModal.submitting || deleteRequestModal.reason.trim().length < 20}
                  className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteRequestModal.submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
