import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Edit, Trash2, Video, File, Download, GripVertical,
  Play, Upload, X, Check, ChevronDown, Users, Calendar,
  DollarSign, BookOpen, FileText, FolderOpen, Eye, Settings,
  Mail, Phone, MapPin, Award, TrendingUp
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';
import ReactPlayer from 'react-player';

const SortableItem = ({ id, children, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center">
        <GripVertical
          className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400 cursor-move"
          {...listeners}
        />
        {children}
      </div>
    </div>
  );
};

const VideoPlayer = ({ videoUrl, onClose }) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const { theme } = useTheme();

  if (!videoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
        >
          <X size={24} />
        </button>

        <div className="aspect-video w-full">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playbackRate={playbackRate}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        </div>

        <div className="p-4 bg-gray-800 flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center text-white"
            >
              <span className="mr-1">{playbackRate}x</span>
              <ChevronDown size={16} />
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-20 bg-gray-700 rounded-md shadow-lg z-10">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${playbackRate === speed
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-200 hover:bg-gray-600'
                      }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseGroups = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const cannotManageGroups = isInstructorRestricted(user, 'manageGroupsSections');
  const cannotEditLectures = isInstructorRestricted(user, 'createEditDeleteLectures');
  const cannotEditAssignments = isInstructorRestricted(user, 'createEditDeleteAssignments');
  const [course, setCourse] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState([]);
  const [archivingGroupId, setArchivingGroupId] = useState(null);
  const [requestingGroupDeleteId, setRequestingGroupDeleteId] = useState(null);
  const [pendingGroupDeleteIds, setPendingGroupDeleteIds] = useState([]);
  const [deleteGroupModal, setDeleteGroupModal] = useState({
    open: false,
    group: null,
    reason: '',
    submitting: false
  });

  // Forms state
  const [groupForm, setGroupForm] = useState({
    name: '',
    level: 'beginner',
    maxStudents: 20,
    startDate: '',
    endDate: ''
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    isFree: true,
    amount: 0
  });

  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    videoFile: null,
    videoUrl: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    file: null,
    fileUrl: ''
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    videoFile: null,
    videoUrl: '',
    file: null,
    fileUrl: ''
  });

  // Fetch course and groups data
  const fetchCourseAndGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch course details
      const courseRes = await axios.get(
        `/api/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourse(courseRes.data.course);

      // Fetch groups for this course
      const groupsRes = await axios.get(
        `/api/groups?course=${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(groupsRes.data.groups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      const message = getApiErrorMessage(error, 'Failed to fetch data');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleArchiveGroup = async (group) => {
    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot archive or unarchive groups right now.');
      return;
    }
    const action = group.isArchived ? 'unarchive' : 'archive';
    const confirmMessage =
      'Archiving hides the group from new students while keeping full access for currently enrolled students. Nothing is deleted — it only becomes invisible to new enrollments.\n\n' +
      `Are you sure you want to ${action} this group?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setArchivingGroupId(group._id);
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `/api/groups/${group._id}/archive`,
        { archive: !group.isArchived },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const successMessage =
        res.data?.message ||
        (res.data?.group?.isArchived
          ? 'Group archived successfully. It will be hidden from new enrollments, but existing students keep access.'
          : 'Group unarchived successfully.');
      toast.success(successMessage);
      await fetchCourseAndGroups();
    } catch (error) {
      console.error('Error updating group archive status:', error);
      const message = getApiErrorMessage(error, 'Failed to update group archive status');
      toast.error(message);
    } finally {
      setArchivingGroupId(null);
    }
  };

  const openGroupDeleteModal = (group) => {
    if (!group) return;

    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot request group deletion right now.');
      return;
    }

    setDeleteGroupModal({ open: true, group, reason: '', submitting: false });
  };

  const handleRequestGroupDelete = async (group) => {
    if (!group) return;

    const trimmed = (deleteGroupModal.reason || '').trim();
    if (trimmed.length < 20) {
      toast.error('Please provide a detailed reason (at least 20 characters).');
      return;
    }

    try {
      setRequestingGroupDeleteId(group._id);
      setDeleteGroupModal((prev) => ({ ...prev, submitting: true }));
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/groups/${group._id}/request-delete`,
        { reason: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        res.data?.message || 'Delete request submitted to admin.'
      );
      setPendingGroupDeleteIds((prev) =>
        prev.includes(group._id) ? prev : [...prev, group._id]
      );
      setDeleteGroupModal({ open: false, group: null, reason: '', submitting: false });
    } catch (error) {
      console.error('Request group delete error:', error);
      const message = getApiErrorMessage(error, 'Failed to request group deletion');

      if (
        error.response?.status === 400 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('already a pending delete request')
      ) {
        setPendingGroupDeleteIds((prev) =>
          prev.includes(group._id) ? prev : [...prev, group._id]
        );
        setDeleteGroupModal({ open: false, group: null, reason: '', submitting: false });
        toast.success(message);
      } else {
        toast.error(message);
        setDeleteGroupModal((prev) => ({ ...prev, submitting: false }));
      }
    } finally {
      setRequestingGroupDeleteId(null);
      setDeleteGroupModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  useEffect(() => {
    fetchCourseAndGroups();
  }, [courseId]);

  // Group CRUD operations
  const handleGroupSubmit = async (e) => {
    e.preventDefault();

    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot create or edit groups right now.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingGroup
        ? `/api/groups/${editingGroup._id}`
        : '/api/groups';

      const method = editingGroup ? 'put' : 'post';
      const payload = editingGroup
        ? { ...groupForm }
        : { ...groupForm, course: courseId };

      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateGroup(false);
      setEditingGroup(null);
      setGroupForm({
        name: '',
        level: 'beginner',
        maxStudents: 20,
        startDate: '',
        endDate: ''
      });
      fetchCourseAndGroups();
      toast.success(`Group ${editingGroup ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving group:', error);
      const fallback = `Failed to ${editingGroup ? 'update' : 'create'} group`;
      const message = getApiErrorMessage(error, fallback);
      toast.error(message);
    }
  };

  const handleEditGroup = (group) => {
    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot edit groups right now.');
      return;
    }

    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      level: group.level || 'beginner',
      maxStudents: group.maxStudents || 20,
      startDate: group.startDate ? group.startDate.split('T')[0] : '',
      endDate: group.endDate ? group.endDate.split('T')[0] : ''
    });
    setShowCreateGroup(true);
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot delete groups right now.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete group "${groupName}"? This will remove all sections, content, and student enrollments.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourseAndGroups();
      toast.success('Group deleted successfully');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to delete group');
      toast.error(message);
    }
  };

  // Student management
  const handleViewStudents = async (group) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/groups/${group._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.group && response.data.group.students) {
        setSelectedGroup(response.data.group);
        // Only include enrollments that are actually linked to a student document
        setSelectedGroupStudents(
          response.data.group.students.filter(
            (s) => s.status === 'enrolled' && s.student && s.student._id
          )
        );
        setShowStudentsModal(true);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  // Section CRUD operations
  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!currentGroupId) return;

    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot create sections right now.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/groups/${currentGroupId}/sections`, sectionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateSection(false);
      setSectionForm({ name: '', isFree: true, amount: 0 });
      fetchCourseAndGroups();
      toast.success('Section created successfully!');
    } catch (error) {
      console.error('Error saving section:', error);
      const message = getApiErrorMessage(error, 'Failed to create section');
      toast.error(message);
    }
  };

  // Content reordering
  const handleDragEnd = async (event, groupId, sectionId, contentType) => {
    const { active, over } = event;

    if (contentType === 'lectures' && cannotEditLectures) {
      toast.error('Your instructor account is suspended. You cannot reorder lectures right now.');
      return;
    }

    if (contentType !== 'lectures' && cannotEditAssignments) {
      toast.error('Your instructor account is suspended. You cannot reorder assignments or projects right now.');
      return;
    }
    if (active.id !== over.id) {
      setSavingOrder(true);

      // Update local state
      setGroups(prevGroups => {
        return prevGroups.map(group => {
          if (group._id === groupId) {
            const updatedSections = group.sections.map(section => {
              if (section._id === sectionId) {
                const contentArray = [...(section[contentType] || [])];
                const oldIndex = contentArray.findIndex(item => item._id === active.id);
                const newIndex = contentArray.findIndex(item => item._id === over.id);

                if (oldIndex === -1 || newIndex === -1) return section;

                const newContentArray = arrayMove(contentArray, oldIndex, newIndex);

                // Update the section with reordered content
                return {
                  ...section,
                  [contentType]: newContentArray
                };
              }
              return section;
            });

            return {
              ...group,
              sections: updatedSections
            };
          }
          return group;
        });
      });

      // Save to backend
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `/api/sections/${sectionId}/reorder-${contentType}`,
          {
            order: groups.find(g => g._id === groupId)
              ?.sections.find(s => s._id === sectionId)
              ?.[contentType]?.map(item => item._id) || []
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error saving order:', error);
        toast.error('Failed to save order');
        fetchCourseAndGroups(); // Revert on error
      } finally {
        setSavingOrder(false);
      }
    }
  };

  // Content CRUD operations
  const handleAddLecture = async (groupId, sectionId) => {
    if (cannotEditLectures) {
      toast.error('Your instructor account is suspended. You cannot add lectures right now.');
      return;
    }

    // Implementation for adding lectures
    toast('Add lecture functionality - implement file upload and form');
  };

  const handleAddAssignment = async (groupId, sectionId) => {
    if (cannotEditAssignments) {
      toast.error('Your instructor account is suspended. You cannot add assignments right now.');
      return;
    }

    // Implementation for adding assignments
    toast('Add assignment functionality - implement file upload and form');
  };

  const handleAddProject = async (groupId, sectionId) => {
    if (cannotEditAssignments) {
      toast.error('Your instructor account is suspended. You cannot add projects right now.');
      return;
    }

    // Implementation for adding projects
    toast('Add project functionality - implement file upload and form');
  };

  const handleViewSections = (groupId) => {
    navigate(`/instructor/groups/${groupId}/sections`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className={`mb-4 flex items-center ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">
            {course?.name} - Groups Management
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage groups, sections, and content for this course
          </p>
        </div>

        {/* Add Group Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (cannotManageGroups) {
                toast.error('Your instructor account is suspended. You cannot create groups right now.');
                return;
              }

              setEditingGroup(null);
              setGroupForm({
                name: '',
                level: 'beginner',
                maxStudents: 20,
                startDate: '',
                endDate: '',
                isActive: true
              });
              setShowCreateGroup(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Group
          </button>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className={`p-12 text-center rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No groups created yet
            </p>
            <button
              onClick={() => {
                if (cannotManageGroups) {
                  toast.error('Your instructor account is suspended. You cannot create groups right now.');
                  return;
                }
                setShowCreateGroup(true);
              }}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Your First Group
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div
                key={group._id}
                className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md'
                  } ${group.isArchived ? 'ring-2 ring-yellow-400/60' : ''}`}
              >
                {/* Group Header */}
                <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{group.name}</h2>
                    <div className={`mt-2 flex items-center space-x-6 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {(group.students || []).filter(s => s.status === 'enrolled' && s.student && s.student._id).length} / {group.maxStudents} Students
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {group.startDate ? new Date(group.startDate).toLocaleDateString() : 'No start date'} - {group.endDate ? new Date(group.endDate).toLocaleDateString() : 'No end date'}
                      </span>
                      {group.isArchived && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewStudents(group)}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Users className="w-4 h-4 mr-1" /> View Students
                    </button>
                    <button
                      onClick={() => handleViewSections(group._id)}
                      className="btn-secondary inline-flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-1" /> Manage Sections
                    </button>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleArchiveGroup(group)}
                      disabled={archivingGroupId === group._id}
                      className={`px-3 py-2 rounded-md border text-sm ${group.isArchived
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                        }`}
                    >
                      {archivingGroupId === group._id
                        ? 'Updating...'
                        : group.isArchived
                          ? 'Unarchive'
                          : 'Archive'}
                    </button>
                    <button
                      onClick={() => openGroupDeleteModal(group)}
                      disabled={
                        requestingGroupDeleteId === group._id ||
                        pendingGroupDeleteIds.includes(group._id)
                      }
                      className="btn-request-delete"
                    >
                      {requestingGroupDeleteId === group._id
                        ? 'Requesting...'
                        : pendingGroupDeleteIds.includes(group._id)
                          ? 'Request Pending'
                          : 'Request Delete'}
                    </button>
                    {/* Instructors can no longer delete groups directly; use archive/inactive instead */}
                  </div>
                </div>

                {/* Sections */}
                {group.sections?.map((section) => (
                  <div key={section._id} className={`p-6 border-b last:border-b-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <FolderOpen className="w-5 h-5 mr-2" />
                        {section.name}
                        {!section.isFree && (
                          <span className="ml-2 flex items-center text-green-600 dark:text-green-400">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${section.amount}
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => {
                          setCurrentGroupId(group._id);
                          setSectionForm({ name: '', isFree: true, amount: 0 });
                          setShowCreateSection(true);
                        }}
                        className="btn-secondary"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                      </button>
                    </div>

                    {/* Lectures */}
                    <div className="mb-6">
                      <h4 className={`text-md font-medium mb-3 flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Video className="w-5 h-5 mr-2" />
                        Lectures
                      </h4>

                      <DndContext
                        collisionDetection={closestCenter}
                        onDragStart={(e) => setActiveDragId(e.active.id)}
                        onDragEnd={(e) => handleDragEnd(e, group._id, section._id, 'lectures')}
                      >
                        <SortableContext items={section.lectures?.map(l => l._id) || []} strategy={verticalListSortingStrategy}>
                          {section.lectures?.map(lecture => (
                            <SortableItem key={lecture._id} id={lecture._id} isDragging={activeDragId === lecture._id}>
                              <div className={`flex items-center justify-between p-3 rounded-lg mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-center">
                                  <span className={theme === 'dark' ? 'text-gray-300' : ''}>{lecture.title}</span>
                                  {lecture.description && (
                                    <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      - {lecture.description.substring(0, 50)}...
                                    </span>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setSelectedVideo(lecture.videoUrl)}
                                    className="btn-icon"
                                    title="Watch"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                  <button className="btn-icon" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="btn-icon text-red-500" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </SortableItem>
                          ))}
                        </SortableContext>
                      </DndContext>

                      <button
                        onClick={() => handleAddLecture(group._id, section._id)}
                        className="btn-secondary mt-2 inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Lecture
                      </button>
                    </div>

                    {/* Assignments */}
                    <div className="mb-6">
                      <h4 className={`text-md font-medium mb-3 flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <FileText className="w-5 h-5 mr-2" />
                        Assignments
                      </h4>

                      <DndContext
                        collisionDetection={closestCenter}
                        onDragStart={(e) => setActiveDragId(e.active.id)}
                        onDragEnd={(e) => handleDragEnd(e, group._id, section._id, 'assignments')}
                      >
                        <SortableContext items={section.assignments?.map(a => a._id) || []} strategy={verticalListSortingStrategy}>
                          {section.assignments?.map(assignment => (
                            <SortableItem key={assignment._id} id={assignment._id} isDragging={activeDragId === assignment._id}>
                              <div className={`flex items-center justify-between p-3 rounded-lg mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex items-center">
                                  <span className={theme === 'dark' ? 'text-gray-300' : ''}>{assignment.title}</span>
                                  {assignment.description && (
                                    <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      - {assignment.description.substring(0, 50)}...
                                    </span>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={assignment.fileUrl}
                                    download
                                    className="btn-icon"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button className="btn-icon" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="btn-icon text-red-500" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </SortableItem>
                          ))}
                        </SortableContext>
                      </DndContext>

                      <button
                        onClick={() => handleAddAssignment(group._id, section._id)}
                        className="btn-secondary mt-2 inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Assignment
                      </button>
                    </div>

                    {/* Project */}
                    <div className="mb-6">
                      <h4 className={`text-md font-medium mb-3 flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Settings className="w-5 h-5 mr-2" />
                        Project
                      </h4>

                      {section.project ? (
                        <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="flex items-center">
                            <span className={theme === 'dark' ? 'text-gray-300' : ''}>{section.project.title}</span>
                            {section.project.description && (
                              <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                - {section.project.description.substring(0, 50)}...
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedVideo(section.project.videoUrl)}
                              className="btn-icon"
                              title="Watch Video"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <a
                              href={section.project.fileUrl}
                              download
                              className="btn-icon"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button className="btn-icon" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="btn-icon text-red-500" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddProject(group._id, section._id)}
                          className="btn-secondary inline-flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Project
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Section Form */}
                {showCreateSection && currentGroupId === group._id && (
                  <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Create New Section
                    </h3>
                    <form onSubmit={handleSectionSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Section Name
                          </label>
                          <input
                            type="text"
                            value={sectionForm.name}
                            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                            className="input-field w-full"
                            placeholder="Enter section name"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`isFree-${group._id}`}
                            checked={sectionForm.isFree}
                            onChange={(e) => setSectionForm({ ...sectionForm, isFree: e.target.checked })}
                            className="mr-2"
                          />
                          <label htmlFor={`isFree-${group._id}`} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            Free Section
                          </label>
                        </div>
                        {!sectionForm.isFree && (
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              Amount ($)
                            </label>
                            <input
                              type="number"
                              value={sectionForm.amount}
                              onChange={(e) => setSectionForm({ ...sectionForm, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="input-field w-full"
                              placeholder="Enter amount"
                              min="0"
                              max={course?.price || 1000}
                              step="0.01"
                              required
                            />
                            {course && (
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Course price: ${course.price}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <button type="submit" className="btn-primary">
                            Create Section
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateSection(false)}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h2>
            <form onSubmit={handleGroupSubmit}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Level
                  </label>
                  <select
                    value={groupForm.level}
                    onChange={e => setGroupForm({ ...groupForm, level: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.maxStudents}
                    onChange={e => setGroupForm({ ...groupForm, maxStudents: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={groupForm.startDate}
                      onChange={e => setGroupForm({ ...groupForm, startDate: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={groupForm.endDate}
                      onChange={e => setGroupForm({ ...groupForm, endDate: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setEditingGroup(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingGroup ? 'Update' : 'Create'} Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteGroupModal.open && deleteGroupModal.group && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div>
                <h2 className="text-lg font-semibold">Request Group Deletion</h2>
                <p
                  className={`mt-1 text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  This sends a request to the admin to permanently delete this group and all of its
                  sections and content. No changes happen until an admin approves.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeleteGroupModal({ open: false, group: null, reason: '', submitting: false })
                }
                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                <p className="text-sm">
                  <span className="font-medium">Group:</span>{' '}
                  {deleteGroupModal.group?.name}
                </p>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Reason for deletion (minimum 20 characters)
                </label>
                <textarea
                  rows={4}
                  value={deleteGroupModal.reason}
                  onChange={(e) =>
                    setDeleteGroupModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-700 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Explain why this group should be deleted..."
                />
                <p
                  className={`mt-1 text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {(deleteGroupModal.reason || '').trim().length} / 20
                </p>
              </div>
            </div>

            <div
              className={`px-6 py-4 border-t flex justify-end gap-3 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setDeleteGroupModal({ open: false, group: null, reason: '', submitting: false })
                }
                disabled={deleteGroupModal.submitting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRequestGroupDelete(deleteGroupModal.group)}
                disabled={deleteGroupModal.submitting}
                className="btn-primary"
              >
                {deleteGroupModal.submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Loading Overlay */}
      {savingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-4 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
            <span>Saving changes...</span>
          </div>
        </div>
      )}
      {/* Students Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
          >
            {/* Modal Header */}
            <div
              className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}
            >
              <div className="flex items-center justify-between">
                <h2
                  className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  Enrolled Students ({selectedGroupStudents.length})
                </h2>
                <button
                  onClick={() => {
                    setShowStudentsModal(false);
                    setSelectedGroup(null);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {selectedGroupStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users
                    className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                      }`}
                  />
                  <p
                    className={
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }
                  >
                    No students enrolled in this group yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedGroupStudents.map((enrollment) => {
                    const studentId = enrollment.student?.id || enrollment.student?._id;

                    return (
                      <div
                        key={enrollment._id}
                        className={`p-4 rounded-lg border ${theme === 'dark'
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-gray-50 border-gray-200'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark'
                                    ? 'bg-primary-900'
                                    : 'bg-primary-100'
                                  }`}
                              >
                                <Users
                                  className={`w-6 h-6 ${theme === 'dark'
                                      ? 'text-primary-400'
                                      : 'text-primary-600'
                                    }`}
                                />
                              </div>
                              <div>
                                <h3
                                  className={`text-lg font-semibold ${theme === 'dark'
                                      ? 'text-white'
                                      : 'text-gray-900'
                                    }`}
                                >
                                  {enrollment.student?.name || 'Unknown Student'}
                                </h3>
                                <div
                                  className={`flex flex-wrap items-center gap-3 text-sm ${theme === 'dark'
                                      ? 'text-gray-400'
                                      : 'text-gray-600'
                                    }`}
                                >
                                  {enrollment.student?.email && (
                                    <span className="flex items-center">
                                      <Mail className="w-4 h-4 mr-1" />
                                      {enrollment.student.email}
                                    </span>
                                  )}
                                  {enrollment.student?.phone && (
                                    <span className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      {enrollment.student.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`grid grid-cols-2 gap-3 text-sm ${theme === 'dark'
                                  ? 'text-gray-300'
                                  : 'text-gray-700'
                                }`}
                            >
                              {enrollment.student?.city && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                  <span>
                                    {enrollment.student.city},{' '}
                                    {enrollment.student.country || ''}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${enrollment.paymentStatus === 'verified' ||
                                      enrollment.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : enrollment.paymentStatus === 'partial'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : enrollment.paymentStatus === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                  {enrollment.paymentStatus === 'verified'
                                    ? 'All Paid'
                                    : enrollment.paymentStatus === 'partial'
                                      ? 'Partially Paid'
                                      : enrollment.paymentStatus || 'pending'}
                                  {enrollment.paidSections !== undefined &&
                                    enrollment.totalSections !== undefined && (
                                      <span className="ml-1">
                                        ({enrollment.paidSections}/
                                        {enrollment.totalSections} sections)
                                      </span>
                                    )}
                                </span>
                              </div>
                              <div className="col-span-2 text-xs">
                                Enrolled:{' '}
                                {new Date(
                                  enrollment.enrollmentDate,
                                ).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {enrollment.progress && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span
                                    className={`flex items-center ${theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                      }`}
                                  >
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Overall Progress
                                  </span>
                                  <span
                                    className={`font-medium ${theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                      }`}
                                  >
                                    {enrollment.progress.total || 0}%
                                  </span>
                                </div>
                                <div
                                  className={`w-full rounded-full h-2 ${theme === 'dark'
                                      ? 'bg-gray-600'
                                      : 'bg-gray-200'
                                    }`}
                                >
                                  <div
                                    className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${enrollment.progress.total || 0}%`,
                                    }}
                                  />
                                </div>
                                <div
                                  className={`flex justify-between text-xs mt-2 ${theme === 'dark'
                                      ? 'text-gray-400'
                                      : 'text-gray-600'
                                    }`}
                                >
                                  <span>
                                    Lectures: {enrollment.progress.lectures || 0}
                                  </span>
                                  <span>
                                    Assignments:{' '}
                                    {enrollment.progress.assignments || 0}
                                  </span>
                                  <span>
                                    Projects: {enrollment.progress.projects || 0}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Instructors can no longer remove students from this modal */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                } flex justify-end`}
            >
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedGroup(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseGroups;
