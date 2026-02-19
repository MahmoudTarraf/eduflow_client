import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Trash2, Video, FileText, Edit, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isInstructorRestricted } from '../../utils/restrictions';
import RemoveStudentDialog from '../../components/common/RemoveStudentDialog';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GroupManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const cannotManageGroups = isInstructorRestricted(user, 'manageGroupsSections');
  const cannotEditLectures = isInstructorRestricted(user, 'createEditDeleteLectures');
  const cannotEditAssignments = isInstructorRestricted(user, 'createEditDeleteAssignments');
  const cannotRemoveStudents = isInstructorRestricted(user, 'removeStudents');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    level: 'beginner',
    maxStudents: 20,
    startDate: '',
    endDate: '',
    schedule: { days: [], time: { start: '18:00', end: '20:00' } },
    enrollmentFee: 0,
    paymentType: 'free'
  });

  const [contentForms, setContentForms] = useState({});
  const [contentSubmitting, setContentSubmitting] = useState({});
  const [removing, setRemoving] = useState({});

  const [sectionForm, setSectionForm] = useState({
    name: '',
    isFree: true,
    amount: 0
  });
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);

  const [activeDragId, setActiveDragId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`/api/groups?course=${courseId}`);
      setGroups(resp.data.groups || []);
    } catch (e) {
      console.error('Fetch groups error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [courseId]);

  const onCreateGroup = async (e) => {
    e.preventDefault();

    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot create or edit groups right now.');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...groupForm,
        course: courseId
      };
      if (editingGroup) {
        await axios.put(`/api/groups/${editingGroup._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/groups', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCreateGroup(false);
      setEditingGroup(null);
      setGroupForm({ name: '', level: 'beginner', maxStudents: 20, startDate: '', endDate: '', schedule: { days: [], time: { start: '18:00', end: '20:00' } }, enrollmentFee: 0, paymentType: 'free' });
      await fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to ${editingGroup ? 'update' : 'create'} group`);
    } finally { setCreating(false); }
  };

  const onEditGroup = (group) => {
    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot edit groups right now.');
      return;
    }

    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      level: group.level,
      maxStudents: group.maxStudents,
      startDate: group.startDate ? new Date(group.startDate).toISOString().split('T')[0] : '',
      endDate: group.endDate ? new Date(group.endDate).toISOString().split('T')[0] : '',
      schedule: group.schedule || { days: [], time: { start: '18:00', end: '20:00' } },
      enrollmentFee: group.enrollmentFee || 0,
      paymentType: group.paymentType || 'free'
    });
    setShowCreateGroup(true);
  };

  const onDeleteGroup = async (groupId, groupName) => {
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
      await fetchGroups();
      toast.success('Group deleted successfully');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete group');
    }
  };

  const onAddContent = async (groupId) => {
    if (cannotEditLectures && cannotEditAssignments) {
      toast.error('Your instructor account is suspended. You cannot add group content right now.');
      return;
    }

    try {
      setContentSubmitting(prev => ({ ...prev, [groupId]: true }));
      const form = contentForms[groupId] || { type: 'video', title: '', url: '' };
      await axios.post(`/api/groups/${groupId}/content`, form);
      setContentForms(prev => ({ ...prev, [groupId]: { type: 'video', title: '', url: '' } }));
      await fetchGroups();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add content');
    } finally {
      setContentSubmitting(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const handleRemoveStudentClick = (groupId, student, courseName) => {
    if (cannotRemoveStudents) {
      toast.error('Your instructor account is suspended. You cannot remove students from groups right now.');
      return;
    }

    setStudentToRemove({ groupId, student, courseName });
    setRemoveDialogOpen(true);
  };

  const onRemoveStudent = async () => {
    if (!studentToRemove) return;

    if (cannotRemoveStudents) {
      toast.error('Your instructor account is suspended. You cannot remove students from groups right now.');
      return;
    }

    try {
      setRemoving(prev => ({ ...prev, [studentToRemove.student._id]: true }));
      await axios.delete(`/api/groups/${studentToRemove.groupId}/students/${studentToRemove.student._id}`);
      await fetchGroups();
      setRemoveDialogOpen(false);
      setStudentToRemove(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove student');
    } finally {
      setRemoving(prev => ({ ...prev, [studentToRemove.student._id]: false }));
    }
  };

  const onCreateSection = async (groupId) => {
    if (cannotManageGroups) {
      toast.error('Your instructor account is suspended. You cannot create sections right now.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/groups/${groupId}/sections`, sectionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSectionForm({ name: '', isFree: true, amount: 0 });
      setShowCreateSection(false);
      await fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create section');
    }
  };

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
      const group = groups.find(g => g._id === groupId);
      const section = group.sections.find(s => s._id === sectionId);
      
      let contentArray = [...section[contentType]];
      const oldIndex = contentArray.findIndex(item => item._id === active.id);
      const newIndex = contentArray.findIndex(item => item._id === over.id);
      const newContentArray = arrayMove(contentArray, oldIndex, newIndex);
      
      // Update local state
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          const updatedSections = g.sections.map(s => {
            if (s._id === sectionId) {
              return { ...s, [contentType]: newContentArray };
            }
            return s;
          });
          return { ...g, sections: updatedSections };
        }
        return g;
      }));
      
      // Save new order to backend
      try {
        setSavingOrder(true);
        const token = localStorage.getItem('token');
        await axios.put(`/api/sections/${sectionId}/reorder-${contentType}`, {
          order: newContentArray.map(item => item._id)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        toast.error(`Failed to save new order: ${error.response?.data?.message || error.message}`);
      } finally {
        setSavingOrder(false);
      }
    }
  };

  const SortableItem = ({ id, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition
    } = useSortable({ id });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: activeDragId === id ? 0.8 : 1
    };
    
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Group Management</h1>
          {user?.instructorStatus === 'approved' && (
            <button 
              onClick={() => {
                setEditingGroup(null);
                setGroupForm({ name: '', level: 'beginner', maxStudents: 20, startDate: '', endDate: '', schedule: { days: [], time: { start: '18:00', end: '20:00' } }, enrollmentFee: 0, paymentType: 'free' });
                setShowCreateGroup(true);
              }} 
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2"/>Add Group
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No groups created yet</p>
            {user?.instructorStatus === 'approved' && (
              <button 
                onClick={() => setShowCreateGroup(true)} 
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5 mr-2"/>Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <motion.div key={g._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{g.name}</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Level: {g.level} · Capacity: {g.currentStudents || 0}/{g.maxStudents}</p>
                  </div>
                  {user?.instructorStatus === 'approved' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onEditGroup(g)}
                        className="btn-secondary inline-flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1"/> Edit
                      </button>
                      <button 
                        onClick={() => onDeleteGroup(g._id, g.name)}
                        className="btn-danger inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1"/> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Sections will be added here */}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Remove Student Confirmation Dialog */}
      <RemoveStudentDialog
        isOpen={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false);
          setStudentToRemove(null);
        }}
        onConfirm={onRemoveStudent}
        studentName={studentToRemove?.student?.name || ''}
        courseName={studentToRemove?.courseName || 'this course'}
        loading={studentToRemove && removing[studentToRemove.student._id]}
      />
    </div>
  );
};

export default GroupManagement;
