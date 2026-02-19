import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3,
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  ChevronDown, 
  ChevronUp,
  X,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LevelManagement = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [levelStats, setLevelStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0
  });
  
  const [editingLevel, setEditingLevel] = useState(null);
  const [deletingLevel, setDeletingLevel] = useState(null);
  const [replacementLevelId, setReplacementLevelId] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/levels/admin/all');
      setLevels(response.data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error('Failed to load levels');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevelStats = async (levelId) => {
    try {
      setLoadingStats(true);
      const response = await axios.get(`/api/levels/${levelId}/stats`);
      setLevelStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching level stats:', error);
      toast.error('Failed to load level details');
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleExpand = async (levelId) => {
    if (expandedLevel === levelId) {
      setExpandedLevel(null);
      setLevelStats(null);
    } else {
      setExpandedLevel(levelId);
      await fetchLevelStats(levelId);
    }
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Level name is required');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/levels', formData);
      toast.success('Level created successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '', order: 0 });
      fetchLevels();
    } catch (error) {
      console.error('Error creating level:', error);
      toast.error(error.response?.data?.message || 'Failed to create level');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLevel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Level name is required');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(`/api/levels/${editingLevel._id}`, formData);
      toast.success('Level updated successfully');
      setShowEditModal(false);
      setEditingLevel(null);
      setFormData({ name: '', description: '', order: 0 });
      fetchLevels();
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error(error.response?.data?.message || 'Failed to update level');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLevel = async () => {
    try {
      setSubmitting(true);
      const payload = {};
      if (replacementLevelId) payload.replacementLevelId = replacementLevelId;
      if (newLevelName) payload.newLevelName = newLevelName;
      
      await axios.delete(`/api/levels/${deletingLevel._id}`, { data: payload });
      toast.success('Level deleted successfully');
      setShowDeleteModal(false);
      setDeletingLevel(null);
      setReplacementLevelId('');
      setNewLevelName('');
      fetchLevels();
    } catch (error) {
      console.error('Error deleting level:', error);
      if (error.response?.data?.requiresReplacement) {
        toast.error(`This level has ${error.response.data.affectedCourses} courses. Please select a replacement level or create a new one.`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete level');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      description: level.description || '',
      order: level.order || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (level) => {
    setDeletingLevel(level);
    setReplacementLevelId('');
    setNewLevelName('');
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            Level Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage course levels, view statistics, and maintain consistency
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Level
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Levels</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {levels.length}
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {levels.reduce((sum, lv) => sum + lv.courseCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Instructors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {levels.reduce((sum, lv) => sum + lv.instructorCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Levels List */}
      <div className="space-y-4">
        {levels.length === 0 ? (
          <div className="card p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No levels yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first level to start organizing courses by difficulty
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Create Level
            </button>
          </div>
        ) : (
          levels.map((level) => (
            <motion.div
              key={level._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              {/* Level Header */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {level.name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                        {level.slug}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                        Order: {level.order}
                      </span>
                    </div>
                    {level.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {level.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {level.courseCount} courses
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {level.instructorCount} instructors
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(level)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit level"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(level)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete level"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleExpand(level._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {expandedLevel === level._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedLevel === level._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="p-6">
                      {loadingStats ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      ) : levelStats && levelStats.courses.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Courses at this level:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {levelStats.courses.map((course) => (
                              <div
                                key={course._id}
                                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {course.name}
                                </h5>
                                {course.instructor && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    By {course.instructor.name}
                                  </p>
                                )}
                                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                                  course.status === 'approved' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                }`}>
                                  {course.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                          No courses at this level yet
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Level Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Level
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLevel} className="space-y-4">
              <div>
                <label className="label">Level Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Expert, Master, etc."
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Brief description of this level"
                />
              </div>

              <div>
                <label className="label">Order (for sorting)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="input-field"
                  placeholder="1, 2, 3..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Level'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Level Modal */}
      {showEditModal && editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Level
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Renaming this level will automatically update all {editingLevel.courseCount} linked courses.
              </p>
            </div>

            <form onSubmit={handleEditLevel} className="space-y-4">
              <div>
                <label className="label">Level Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>

              <div>
                <label className="label">Order (for sorting)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Level'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Level Modal */}
      {showDeleteModal && deletingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Delete Level
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-900 dark:text-white mb-4">
                You are about to delete the level: <strong>{deletingLevel.name}</strong>
              </p>

              {deletingLevel.courseCount > 0 && (
                <>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      <strong>Warning:</strong> This level has <strong>{deletingLevel.courseCount} course(s)</strong>.
                      You must select a replacement level or create a new one.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Replacement Level (Option 1)</label>
                      <select
                        value={replacementLevelId}
                        onChange={(e) => {
                          setReplacementLevelId(e.target.value);
                          if (e.target.value) setNewLevelName('');
                        }}
                        className="input-field"
                      >
                        <option value="">Select a level...</option>
                        {levels
                          .filter(lv => lv._id !== deletingLevel._id)
                          .map(lv => (
                            <option key={lv._id} value={lv._id}>
                              {lv.name} ({lv.courseCount} courses)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="text-center text-gray-600 dark:text-gray-400 font-medium">
                      - OR -
                    </div>

                    <div>
                      <label className="label">Create New Level (Option 2)</label>
                      <input
                        type="text"
                        value={newLevelName}
                        onChange={(e) => {
                          setNewLevelName(e.target.value);
                          if (e.target.value) setReplacementLevelId('');
                        }}
                        className="input-field"
                        placeholder="Enter new level name..."
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        A new level will be created and all courses will be reassigned to it
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLevel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={submitting || (deletingLevel.courseCount > 0 && !replacementLevelId && !newLevelName)}
              >
                {submitting ? 'Deleting...' : 'Delete Level'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LevelManagement;
