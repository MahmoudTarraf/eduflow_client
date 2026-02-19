import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const StudentSettings = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    aboutMe: '',
    jobRole: 'Learner',
    avatar: ''
  });
  const [changeLimits, setChangeLimits] = useState({
    emailChangeCount: 0,
    phoneChangeCount: 0
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [emailCooldownSeconds, setEmailCooldownSeconds] = useState(0);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Check if user is suspended and blocked from accessing settings
      if (user?.status === 'suspended' && user?.restrictions?.changeSettings) {
        toast.error('Your account is suspended. You cannot access settings.');
        navigate('/student');
        return;
      }
      
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = res.data.user;
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        aboutMe: profile.aboutMe || '',
        jobRole: profile.jobRole || 'Learner',
        avatar: profile.avatar || ''
      });
      setAvatarPreview(profile.avatar || null);
      setChangeLimits({
        emailChangeCount: profile.emailChangeCount || 0,
        phoneChangeCount: profile.phoneChangeCount || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAboutMeChange = (value) => {
    setFormData(prev => ({ ...prev, aboutMe: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageMustBeLess5MB'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(t('pleaseSelectImage'));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSendEmailVerificationCode = async () => {
    if (!newEmail) {
      toast.error(t('enterNewEmail') || 'Please enter a new email');
      return;
    }

    const trimmedEmail = newEmail.trim();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error(t('invalidEmailFormat') || 'Please enter a valid email address.');
      return;
    }

    try {
      setSendingCode(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/users/change-email/request', { newEmail: trimmedEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailCodeSent(true);
      const serverCooldown = res?.data?.cooldownRemainingSeconds;
      const initialSeconds =
        typeof serverCooldown === 'number' && serverCooldown > 0 ? serverCooldown : 60;
      setEmailCooldownSeconds(initialSeconds);
      toast.success(t('verificationCodeSent') || 'Verification code sent');
    } catch (error) {
      console.error('Error sending verification code:', error);
      const status = error?.response?.status;
      const data = error?.response?.data;
      if (status === 429 && typeof data?.cooldownRemainingSeconds === 'number') {
        const remaining = data.cooldownRemainingSeconds;
        setEmailCooldownSeconds(remaining);
        toast.error(
          t('youCanRequestNewCodeIn', { seconds: remaining }) ||
          data?.message ||
          'Please wait before requesting a new verification code.'
        );
      } else {
        toast.error(
          data?.message ||
          t('failedToSendVerificationCode') ||
          'Failed to send verification code'
        );
      }
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    if (emailCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldownSeconds]);

  const handleVerifyEmailChange = async () => {
    const trimmedEmail = (newEmail || '').trim();
    const trimmedCode = (verificationCode || '').trim();

    if (!trimmedEmail || !trimmedCode) {
      toast.error(t('enterVerificationCode') || 'Please enter your new email and verification code');
      return;
    }

    try {
      setVerifyingEmail(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/users/change-email/verify',
        {
          newEmail: trimmedEmail,
          verificationCode: trimmedCode
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = res?.data?.user;
      if (updatedUser) {
        if (setUser) {
          setUser(updatedUser);
        }
        setFormData((prev) => ({
          ...prev,
          email: updatedUser.email || prev.email
        }));
        setChangeLimits((prev) => ({
          ...prev,
          emailChangeCount:
            typeof updatedUser.emailChangeCount === 'number'
              ? updatedUser.emailChangeCount
              : (prev.emailChangeCount || 0) + 1
        }));
      }

      toast.success(t('emailChangedSuccessfully') || 'Email changed successfully');
      setShowEmailModal(false);
      setNewEmail('');
      setVerificationCode('');
      setEmailCodeSent(false);
    } catch (error) {
      const message = error?.response?.data?.message;
      if (message === 'You have already changed your email once') {
        toast.error(t('youHaveAlreadyChangedEmailOnce') || message);
      } else if (message === 'Invalid verification code') {
        toast.error(t('invalidVerificationCode') || message);
      } else if (message === 'Verification code has expired. Please request a new code.') {
        toast.error(t('verificationCodeExpired') || message);
      } else {
        toast.error(t('failedToVerifyEmail') || message || 'Failed to verify email change');
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleUpdatePhoneNumber = async () => {
    const trimmedPhone = (newPhone || '').trim();
    if (!trimmedPhone) {
      toast.error(t('phone') || 'Phone number is required');
      return;
    }

    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error(t('phoneMustStartWith09') || 'Phone number must be 10 digits starting with 09');
      return;
    }

    try {
      setUpdatingPhone(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('phone', trimmedPhone);

      const res = await axios.put('/api/users/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = res?.data?.user;
      if (updatedUser) {
        if (setUser) {
          setUser(updatedUser);
        }
        setFormData((prev) => ({
          ...prev,
          phone: updatedUser.phone || prev.phone
        }));
        setChangeLimits((prev) => ({
          ...prev,
          phoneChangeCount:
            typeof updatedUser.phoneChangeCount === 'number'
              ? updatedUser.phoneChangeCount
              : (prev.phoneChangeCount || 0) + 1
        }));
      }

      toast.success(t('phoneChangedSuccessfully') || 'Phone number updated successfully');
      setShowPhoneModal(false);
      setNewPhone('');
    } catch (error) {
      const message = error?.response?.data?.message;
      if (message === 'Phone number already exists') {
        toast.error(t('phoneNumberAlreadyExists') || message);
      } else if (message === 'You have already changed your phone number') {
        toast.error(t('youHaveAlreadyChangedPhoneNumber') || message);
      } else if (message === 'Phone number must be 10 digits starting with 09') {
        toast.error(t('phoneMustStartWith09') || message);
      } else {
        toast.error(t('failedToChangePhone') || message || 'Failed to change phone number');
      }
    } finally {
      setUpdatingPhone(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is suspended and blocked from changing profile
    if (user?.status === 'suspended' && user?.restrictions?.changeProfile) {
      toast.error('Your account is suspended. You cannot change your profile information.');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('aboutMe', formData.aboutMe);
      formDataToSend.append('jobRole', formData.jobRole);
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      
      const res = await axios.put('/api/users/profile', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user in auth context
      if (setUser && res.data.user) {
        setUser(res.data.user);
      }
      
      toast.success('Profile updated successfully');
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('studentSettings')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('manageProfileAndPreferences')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('profileInformation')}
            </h2>
            
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profilePicture')}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={t('avatarPreview')}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                        {formData.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('chooseImage')}
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('imageRequirements')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('nameCanOnlyBeChanged')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  required
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('emailChangeableOnce') || 'Email (changeable once)'}
                  </span>
                  <span>
                    {t('emailChangesRemaining') || 'Email changes remaining'}: {Math.max(0, 1 - (changeLimits.emailChangeCount || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  disabled={changeLimits.emailChangeCount >= 1}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-500 text-indigo-600 dark:text-indigo-300 rounded-md text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('changeEmail') || 'Change Email'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('phoneChangeableOnce') || 'Phone number (changeable once)'}
                  </span>
                  <span>
                    {t('phoneChangesRemaining') || 'Phone changes remaining'}: {Math.max(0, 1 - (changeLimits.phoneChangeCount || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  disabled={changeLimits.phoneChangeCount >= 1}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-500 text-indigo-600 dark:text-indigo-300 rounded-md text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('changePhoneNumber') || 'Change Phone Number'}
                </button>
              </div>

              <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {t('studentEmailUsernameWarning') || 'Note: You can change your email one time only. Your username appears on your certificates, so make sure it is correct before requesting changes.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('jobRole')}
                </label>
                <input
                  type="text"
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder={t('jobRolePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('shortBio')}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('bioBriefIntro')}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.bio.length}/500 {t('charactersCount')}
                </p>
              </div>
            </div>
          </div>

          {/* About Me (Rich Text) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('aboutMeDetailed')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('shareMoreAboutYourself')}
            </p>
            
            <div className="bg-white dark:bg-gray-700 rounded-md quill-editor-dark">
              <ReactQuill
                theme="snow"
                value={formData.aboutMe}
                onChange={handleAboutMeChange}
                modules={quillModules}
                className="dark:text-white"
                style={{ minHeight: '200px' }}
              />
              <style>{`
                .quill-editor-dark .ql-toolbar {
                  background: white;
                  border-color: #d1d5db;
                }
                .dark .quill-editor-dark .ql-toolbar {
                  background: #374151;
                  border-color: #4b5563;
                }
                .dark .quill-editor-dark .ql-stroke {
                  stroke: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-fill {
                  fill: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-picker-label {
                  color: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-picker-options {
                  background: #374151;
                  border-color: #4b5563;
                }
                .dark .quill-editor-dark .ql-picker-item {
                  color: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-editor {
                  background: #1f2937;
                  color: #e5e7eb;
                }
              `}</style>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {t('saveSettings')}
            </button>
          </div>
        </form>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 ${
                isRTL ? 'text-right' : ''
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('changeEmail') || 'Change Email'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setNewEmail('');
                    setVerificationCode('');
                    setEmailCodeSent(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('newEmail') || 'New Email'}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t('enterNewEmail') || 'Enter your new email'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between space-x-3">
                    <button
                      type="button"
                      onClick={handleSendEmailVerificationCode}
                      disabled={
                        sendingCode ||
                        changeLimits.emailChangeCount >= 1 ||
                        emailCooldownSeconds > 0
                      }
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {sendingCode
                        ? t('sendingCode') || 'Sending code...'
                        : t('sendVerificationCode') || 'Send Verification Code'}
                    </button>
                  </div>
                  {emailCooldownSeconds > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('youCanRequestNewCodeIn', { seconds: emailCooldownSeconds }) ||
                        `You can request a new code in ${emailCooldownSeconds} seconds.`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('verificationCode') || 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={t('enterVerificationCode') || 'Enter the 6-digit code'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {emailCodeSent && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('verificationCodeSentHint') || 'A verification code was sent to your new email and is valid for 10 minutes.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setNewEmail('');
                      setVerificationCode('');
                      setEmailCodeSent(false);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmailChange}
                    disabled={verifyingEmail}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {verifyingEmail
                      ? t('verifying') || 'Verifying...'
                      : t('verifyEmail') || 'Verify Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 ${
                isRTL ? 'text-right' : ''
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('changePhoneNumber') || 'Change Phone Number'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneModal(false);
                    setNewPhone('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('phone')}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm">
                      +963
                    </span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        const limited = digitsOnly.slice(0, 10);
                        setNewPhone(limited);
                      }}
                      placeholder={t('enterNewPhone') || 'Enter your new phone number (09xxxxxxxx)'}
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('phoneMustStartWith09') || 'Phone number must be 10 digits starting with 09'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhoneModal(false);
                      setNewPhone('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePhoneNumber}
                    disabled={updatingPhone}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {updatingPhone
                      ? t('updating') || 'Updating...'
                      : t('confirmPhoneChange') || 'Confirm Phone Change'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6 border-2 border-red-200 dark:border-red-900">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                {t('dangerZone')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('irreversibleActions')}
              </p>
            </div>
          </div>

          <div className="border-t border-red-200 dark:border-red-900 pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('deleteAccount')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('permanentlyDeleteAccount')}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{t('deleteMyAccount')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('deleteAccountConfirmTitle')}
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('thisActionPermanent')}
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                  <li>{t('profileInfo')}</li>
                  <li>{t('courseEnrollments')}</li>
                  <li>{t('certificatesData')}</li>
                  <li>{t('progressAndGrades')}</li>
                  <li>{t('messagesAndNotifications')}</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  {t('willBePermanentlyDeleted')}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('typeToConfirm')} <span className="font-bold text-red-600">"{t('deleteMyAccountCaps')}"</span> {t('toConfirm')}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={t('deleteMyAccountCaps')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
                      toast.error(t('pleaseTypeToConfirm'));
                      return;
                    }

                    try {
                      setDeleting(true);
                      const token = localStorage.getItem('token');
                      await axios.delete('/api/users/account', {
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      toast.success('Account deleted successfully');
                      // AuthContext.logout will redirect to /login
                      logout();
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      toast.error(error.response?.data?.message || 'Failed to delete account');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('deleting')}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>{t('deleteAccount')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSettings;
