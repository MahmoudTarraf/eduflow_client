import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  Inbox, 
  Send as SentIcon,
  Search,
  User,
  Clock,
  X,
  Shield,
  GraduationCap,
  Trash2,
  Plus,
  Mail
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showBulkCompose, setShowBulkCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState(null);
  const [adminContact, setAdminContact] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [publicIdentity, setPublicIdentity] = useState({ platformName: 'EduFlow', platformEmail: '' });

  useEffect(() => {
    fetchData();
    if (user?.role === 'student' || user?.role === 'instructor') {
      fetchContacts();
    }
    if (user?.role === 'instructor') {
      fetchInstructorCourses();
    }
  }, [user]);

  useEffect(() => {
    const loadPublicIdentity = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data?.success && res.data.data) {
          setPublicIdentity({
            platformName: res.data.data.platformName || 'EduFlow',
            platformEmail: res.data.data.platformEmail || ''
          });
        }
      } catch (error) {
        console.error('Error loading public identity:', error);
      }
    };

    loadPublicIdentity();
  }, []);

  // Mark messages as read when switching to inbox tab
  useEffect(() => {
    if (activeTab === 'inbox') {
      markInboxAsRead();
    } else if (activeTab === 'notifications') {
      markNotificationsAsRead();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [messagesResponse, notificationsResponse] = await Promise.all([
        axios.get('/api/messages', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/messages/notifications', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setMessages(messagesResponse.data.messages || []);
      setNotifications(notificationsResponse.data.notifications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Use new contacts API
      const response = await axios.get('/api/messages/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allContacts = response.data.contacts || [];
      
      // Separate admin and instructors for display
      const admin = allContacts.find(c => c.role === 'admin');
      const instructorsList = allContacts.filter(c => c.role === 'instructor');
      
      setAdminContact(admin);
      setInstructors(instructorsList);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const markInboxAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadMessages = messages.filter(msg => 
        msg.recipient && msg.recipient._id === user.id && !msg.isRead
      );
      
      if (unreadMessages.length === 0) return;
      
      // Mark all inbox messages as read
      await axios.put('/api/messages/mark-read', {
        messageIds: unreadMessages.map(m => m._id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.recipient && msg.recipient._id === user.id ? { ...msg, isRead: true } : msg
        )
      );
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('unreadCountChanged'));
      
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotifs = notifications.filter(n => !n.read);
      
      if (unreadNotifs.length === 0) return;
      
      // Mark all notifications as read
      await axios.put('/api/messages/notifications/mark-read', {
        notificationIds: unreadNotifs.map(n => n._id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prevNotifs => 
        prevNotifs.map(notif => ({ ...notif, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('unreadCountChanged'));
      
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/messages/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prevNotifs => prevNotifs.filter(notif => notif._id !== notificationId));
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('unreadCountChanged'));
      
      toast.success('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAllInbox = async () => {
    if (!window.confirm('Are you sure you want to delete all inbox messages?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const inboxMessages = messages.filter(msg => msg.recipient && msg.recipient._id === user.id);
      
      if (inboxMessages.length === 0) {
        toast.info('No messages to clear');
        return;
      }

      // Delete all inbox messages
      await Promise.all(
        inboxMessages.map(msg => 
          axios.delete(`/api/messages/${msg._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      // Update local state - remove only inbox messages
      setMessages(prevMessages => prevMessages.filter(msg => !msg.recipient || msg.recipient._id !== user.id));
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('unreadCountChanged'));
      
      toast.success('All inbox messages cleared');
    } catch (error) {
      console.error('Error clearing inbox:', error);
      toast.error('Failed to clear inbox');
    }
  };

  const handleClearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (notifications.length === 0) {
        toast.info('No notifications to clear');
        return;
      }

      // Delete all notifications
      await Promise.all(
        notifications.map(notif => 
          axios.delete(`/api/messages/notifications/${notif._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      // Update local state
      setNotifications([]);
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('unreadCountChanged'));
      
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const handleCompose = (recipient) => {
    setComposeRecipient(recipient);
    setShowCompose(true);
  };

  const fetchInstructorCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSendBulkMessage = async (e) => {
    e.preventDefault();
    const form = e.target;
    const subject = form.subject.value.trim();
    const content = form.content.value.trim();
    const recipientType = form.recipientType.value;
    const courseId = form.courseId?.value;
    
    if (!subject || subject.length < 2) {
      toast.error('Subject must be at least 2 characters');
      return;
    }
    
    if (!content || content.length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }
    
    try {
      setSendingBulk(true);
      const token = localStorage.getItem('token');
      const payload = {
        recipientType,
        subject,
        content
      };
      
      if (courseId) {
        payload.courseId = courseId;
      }
      
      const response = await axios.post('/api/messages/bulk', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowBulkCompose(false);
      form.reset();
      await fetchData();
      setActiveTab('sent');
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error sending bulk message:', error);
      toast.error(error.response?.data?.message || 'Failed to send bulk message');
    } finally {
      setSendingBulk(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const form = e.target;
    const subject = form.subject.value.trim();
    const content = form.content.value.trim();
    
    if (!subject || subject.length < 2) {
      toast.error('Subject must be at least 2 characters');
      return;
    }
    
    if (!content || content.length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }
    
    if (!composeRecipient || !composeRecipient._id) {
      toast.error('Invalid recipient');
      return;
    }
    
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/messages', {
        recipient: composeRecipient._id,
        subject,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCompose(false);
      setComposeRecipient(null);
      form.reset();
      fetchData();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to send message';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  // Search users for creating new message (admin/instructor only)
  const handleSearchUsers = async (searchQuery) => {
    setUserSearchTerm(searchQuery);
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/messages/search-users?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setUserSearchTerm(recipient.name);
    setSearchResults([]);
  };

  const handleSendNewMessage = async (e) => {
    e.preventDefault();
    const form = e.target;
    const subject = form.subject.value.trim();
    const content = form.content.value.trim();
    
    if (!subject || subject.length < 2) {
      toast.error('Subject must be at least 2 characters');
      return;
    }
    
    if (!content || content.length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }
    
    if (!selectedRecipient || !selectedRecipient._id) {
      toast.error('Please select a recipient');
      return;
    }
    
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/messages', {
        recipient: selectedRecipient._id,
        subject,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateMessage(false);
      setSelectedRecipient(null);
      setUserSearchTerm('');
      form.reset();
      fetchData(); // Refresh messages to show in sent tab
      setActiveTab('sent'); // Switch to sent tab
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to send message';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const inboxMessages = filteredMessages.filter(msg => msg.recipient && msg.recipient._id === user.id);
  const sentMessages = filteredMessages.filter(msg => msg.sender && msg.sender._id === user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('messages')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your messages and notifications
              </p>
            </div>
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateMessage(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Message</span>
                </button>
                <button
                  onClick={() => setShowBulkCompose(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Bulk Message</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="card">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('messages')}
                </h2>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    activeTab === 'inbox'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span className="font-medium">{t('inbox')}</span>
                  <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {inboxMessages.filter(m => !m.isRead).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('sent')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    activeTab === 'sent'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <SentIcon className="w-4 h-4" />
                  <span className="font-medium">{t('sent')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    activeTab === 'notifications'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{t('notifications')}</span>
                  <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </button>
              </nav>

              {/* Direct Contacts */}
              {(user?.role === 'student' || user?.role === 'instructor') && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Direct Contact</h3>
                  
                  {/* Admin Contact (public identity for email) */}
                  {adminContact && (
                    <button
                      onClick={() => handleCompose(adminContact)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mb-2"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {publicIdentity.platformEmail || 'support@example.com'}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Instructors - Student Only */}
                  {user?.role === 'student' && instructors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Your Instructors</p>
                      {instructors.map(instructor => (
                        <button
                          key={instructor._id}
                          onClick={() => handleCompose(instructor)}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mb-2"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{instructor.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{instructor.courseName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Messages List */}
            <div className="card">
              {activeTab === 'inbox' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('inbox')}
                    </h3>
                    <div className="flex items-center gap-2">
                      {inboxMessages.filter(m => !m.isRead).length > 0 && (
                        <button
                          onClick={markInboxAsRead}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark All as Read
                        </button>
                      )}
                      {inboxMessages.length > 0 && (
                        <button
                          onClick={handleClearAllInbox}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  {inboxMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No messages in inbox</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inboxMessages.map((message, index) => (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            message.isRead 
                              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar with role indicator */}
                            <div className="relative">
                              {message.sender.avatar ? (
                                <img
                                  src={`${axios.defaults.baseURL || 'http://localhost:5000'}${message.sender.avatar}`}
                                  alt={message.sender.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  message.sender.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30' :
                                  message.sender.role === 'instructor' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                  'bg-green-100 dark:bg-green-900/30'
                                }`}>
                                  {message.sender.role === 'admin' ? (
                                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                                  ) : message.sender.role === 'instructor' ? (
                                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  )}
                                </div>
                              )}
                              {!message.isRead && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {message.sender.name}
                                  </h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    message.sender.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    message.sender.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {message.sender.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mt-1">
                                {message.subject}
                              </h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sent' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('sent')}
                  </h3>
                  {sentMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <SentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No sent messages</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sentMessages.map((message, index) => (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Recipient Avatar with role indicator */}
                            {message.recipient.avatar ? (
                              <img
                                src={`${axios.defaults.baseURL || 'http://localhost:5000'}${message.recipient.avatar}`}
                                alt={message.recipient.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                message.recipient.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30' :
                                message.recipient.role === 'instructor' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                'bg-green-100 dark:bg-green-900/30'
                              }`}>
                                {message.recipient.role === 'admin' ? (
                                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                                ) : message.recipient.role === 'instructor' ? (
                                  <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    To: {message.recipient.name}
                                  </h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    message.recipient.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    message.recipient.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {message.recipient.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mt-1">
                                {message.subject}
                              </h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('notifications')}
                    </h3>
                    <div className="flex items-center gap-2">
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={markNotificationsAsRead}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark All as Read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            notification.read 
                              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                              notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                              notification.type === 'error' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-blue-100 dark:bg-blue-900'
                            }`}>
                              <Clock className={`w-5 h-5 ${
                                notification.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                notification.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                'text-blue-600 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-gray-900 dark:text-white flex-1">
                                  {notification.message}
                                </p>
                                <button
                                  onClick={() => handleDeleteNotification(notification._id)}
                                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Compose Message Modal */}
        {showCompose && composeRecipient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    New Message to {composeRecipient.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCompose(false);
                      setComposeRecipient(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      minLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter subject (min 2 characters)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      name="content"
                      required
                      minLength={10}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type your message (min 10 characters)..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompose(false);
                        setComposeRecipient(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Compose Message Modal */}
        {showBulkCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Send Bulk Message
                  </h2>
                  <button
                    onClick={() => setShowBulkCompose(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSendBulkMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Send To
                    </label>
                    <select
                      name="recipientType"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {user?.role === 'instructor' && (
                        <option value="enrolled_students">All Enrolled Students in Course</option>
                      )}
                      {user?.role === 'admin' && (
                        <>
                          <option value="all_instructors">All Instructors</option>
                          <option value="all_students">All Students</option>
                        </>
                      )}
                    </select>
                  </div>

                  {user?.role === 'instructor' && userCourses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Course
                      </label>
                      <select
                        name="courseId"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select a course...</option>
                        {userCourses.map(course => (
                          <option key={course._id} value={course._id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      minLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter subject (min 2 characters)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      name="content"
                      required
                      minLength={10}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type your message (min 10 characters)..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowBulkCompose(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingBulk}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingBulk ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send to All</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Message Modal with User Search */}
        {showCreateMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Message
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateMessage(false);
                      setSelectedRecipient(null);
                      setUserSearchTerm('');
                      setSearchResults([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSendNewMessage} className="space-y-4">
                  {/* User Search Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To: {user?.role === 'admin' ? 'Search for a student or instructor' : 'Search for an enrolled student'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        placeholder={user?.role === 'admin' ? 'Type name or email...' : 'Type student name or email...'}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        disabled={!!selectedRecipient}
                      />
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      {selectedRecipient && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecipient(null);
                            setUserSearchTerm('');
                          }}
                          className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Selected Recipient Display */}
                    {selectedRecipient && (
                      <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {selectedRecipient.avatar ? (
                            <img src={selectedRecipient.avatar} alt={selectedRecipient.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {selectedRecipient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedRecipient.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{selectedRecipient.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedRecipient.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          selectedRecipient.role === 'instructor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {selectedRecipient.role}
                        </span>
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && !selectedRecipient && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleSelectRecipient(user)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 text-left"
                          >
                            <div className="flex-shrink-0">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              user.role === 'instructor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {user.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Searching State */}
                    {searchingUsers && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span>Searching...</span>
                      </div>
                    )}

                    {/* No Results */}
                    {userSearchTerm.length >= 2 && searchResults.length === 0 && !searchingUsers && !selectedRecipient && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      minLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter subject (min 2 characters)..."
                    />
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      name="content"
                      required
                      minLength={10}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type your message (min 10 characters)..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMessage(false);
                        setSelectedRecipient(null);
                        setUserSearchTerm('');
                        setSearchResults([]);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !selectedRecipient}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
