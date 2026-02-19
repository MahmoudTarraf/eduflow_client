import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Key,
  Globe,
  Palette,
  Settings,
  MapPin,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, updatePassword, logout, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pendingActionsAnimations, setPendingActionsAnimations] = useState(
    user?.preferences?.enablePendingActionsAnimations ?? true
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isRTL = i18n.language === 'ar' || i18n.language === 'he' || i18n.language === 'fa';

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      country: user?.country || '',
      city: user?.city || '',
      school: user?.school || ''
    }
  });

  // Reset form when user data changes
  React.useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        school: user.school || ''
      });
    }
  }, [user, resetProfile]);

  React.useEffect(() => {
    if (user && user.preferences) {
      const value =
        typeof user.preferences.enablePendingActionsAnimations === 'boolean'
          ? user.preferences.enablePendingActionsAnimations
          : true;
      setPendingActionsAnimations(value);
    }
  }, [user]);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  const newPasswordValue = watchPassword('newPassword');

  const onProfileSubmit = async (data) => {
    setLoading(true);
    console.log('[Profile] Submitting profile update:', data);
    const result = await updateProfile(data);
    console.log('[Profile] Update result:', result);
    setLoading(false);
  };

  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    const result = await deleteAccount();
    setDeletingAccount(false);
    if (result && result.success) {
      setShowDeleteModal(false);
    }
  };

  const handleTogglePendingActionsAnimations = async () => {
    const nextValue = !pendingActionsAnimations;
    setLoading(true);
    const result = await updateProfile({
      preferences: { enablePendingActionsAnimations: nextValue }
    });
    if (result && result.success) {
      setPendingActionsAnimations(nextValue);
    }
    setLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    const result = await updatePassword(data);
    if (result.success) {
      resetPassword();
      // Logout after password change; AuthContext.logout will redirect to /login
      setTimeout(() => {
        logout();
      }, 1500);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'profile', name: t('profileInformation'), icon: <User className="w-4 h-4" /> },
    { id: 'password', name: t('changePassword'), icon: <Key className="w-4 h-4" /> },
    { id: 'preferences', name: t('preferences'), icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('accountSettings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageAccountSettingsAndPreferences')}
          </p>
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
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            {activeTab === 'profile' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {t('profileInformation')}
                </h2>
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('name')}
                    </label>
                    {user?.role === 'student' || user?.role === 'instructor' ? (
                      <>
                        <input
                          {...registerProfile('name')}
                          type="text"
                          disabled
                          className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {t('adminOnlyCanChangeUsername') || 'Admin only can change username'}
                        </p>
                      </>
                    ) : (
                      <>
                        <input
                          {...registerProfile('name', {
                            required: 'Name is required',
                            minLength: {
                              value: 2,
                              message: 'Name must be at least 2 characters'
                            }
                          })}
                          type="text"
                          className="input-field"
                        />
                        {profileErrors.name && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {profileErrors.name.message}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('emailCannotBeChanged')}
                    </p>
                    {(user?.role === 'student' || user?.role === 'instructor') && (
                      <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          {user?.role === 'student'
                            ? (t('studentEmailUsernameWarning') ||
                              'Note: You can change your email one time only. Your username appears on your certificates, so make sure it is correct before requesting changes.')
                            : (t('instructorPublicInfoWarning') ||
                              'Warning: Your email, username, and intro video are publicly visible to students. Please make sure the information you enter is accurate and appropriate.')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('phone')}
                    </label>
                    <input
                      {...registerProfile('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^09\d{8}$/,
                          message: 'Phone number must start with 09 and be exactly 10 digits'
                        },
                        maxLength: {
                          value: 10,
                          message: 'Phone number must be exactly 10 digits'
                        }
                      })}
                      type="tel"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      maxLength={10}
                      placeholder="09XXXXXXXX"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {profileErrors.phone.message}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Must start with 09 and be exactly 10 digits
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('countryLabel')}
                    </label>
                    <input
                      {...registerProfile('country')}
                      type="text"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      placeholder={t('enterYourCountry')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('cityLabel')}
                    </label>
                    <input
                      {...registerProfile('city')}
                      type="text"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      placeholder={t('enterYourCity')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('schoolLabel')}
                    </label>
                    <input
                      {...registerProfile('school')}
                      type="text"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      placeholder={t('enterYourSchoolUniversity')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed capitalize"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? (t('loading') || 'Saving...') : t('saveSettings')}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {t('changePassword')}
                </h2>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('currentPassword')}
                    </label>
                    <input
                      {...registerPassword('currentPassword', {
                        required: t('currentPasswordRequired') || 'Current password is required'
                      })}
                      type="password"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('newPassword')}
                    </label>
                    <input
                      {...registerPassword('newPassword', {
                        required: t('newPasswordRequired') || 'New password is required',
                        validate: (value) => {
                          if (!value || value.length < 8) return t('passwordMinLength') || 'Password must be at least 8 characters';
                          if (!/[a-z]/.test(value)) return t('passwordRequireLower') || 'Password must include at least one lowercase letter';
                          if (!/[A-Z]/.test(value)) return t('passwordRequireUpper') || 'Password must include at least one uppercase letter';
                          if (!/[0-9]/.test(value)) return t('passwordRequireNumber') || 'Password must include at least one number';
                          if (!/[^A-Za-z0-9]/.test(value)) return t('passwordRequireSymbol') || 'Password must include at least one symbol';
                          return true;
                        }
                      })}
                      type="password"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('confirmNewPassword')}
                    </label>
                    <input
                      {...registerPassword('confirmNewPassword', {
                        required: t('confirmPasswordRequired') || 'Please confirm your new password',
                        validate: (value) =>
                          value === newPasswordValue ||
                          (t('passwordsDoNotMatch') || 'Passwords do not match')
                      })}
                      type="password"
                      className={`input-field ${isRTL ? 'text-right rtl' : 'text-left ltr'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {passwordErrors.confirmNewPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>{loading ? t('loading') || 'Updating...' : t('changePassword')}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {t('preferences')}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {t('themePreference')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('choosePreferredTheme')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="btn-secondary"
                    >
                      {theme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {t('languagePreference')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('choosePreferredLanguage')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleLanguage}
                      className="btn-secondary"
                    >
                      {language === 'en' ? t('switchToArabic') : t('switchToEnglish')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {t('pendingActionsAnimationsLabel')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('pendingActionsAnimationsDescription')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePendingActionsAnimations}
                      disabled={loading}
                      className="btn-secondary"
                    >
                      {pendingActionsAnimations
                        ? t('pendingActionsAnimationsDisable')
                        : t('pendingActionsAnimationsEnable')}
                    </button>
                  </div>
                  {user?.role === 'instructor' && (
                    <div className="mt-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                            Instructor Account Deletion
                          </h3>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            This will permanently disable your instructor account and remove your access to the
                            instructor dashboard and courses, while keeping all courses, students, and financial
                            records intact for the platform.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className="ml-4 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete Instructor Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      {user?.role === 'instructor' && showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Delete Instructor Account
              </h2>
              <button
                type="button"
                onClick={() => !deletingAccount && setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                disabled={deletingAccount}
              >
                <Key className="w-5 h-5" />
              </button>
            </div>

            <div className="text-gray-700 dark:text-gray-200 text-sm space-y-4 mb-6">
              <p>
                Deleting your instructor account will <span className="font-semibold">remove your instructor access</span>
                while keeping all of your courses, students, and financial history intact for the platform.
              </p>

              <div>
                <p className="font-semibold mb-1">You will lose access to</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your instructor dashboard.</li>
                  <li>All of your courses and course management tools.</li>
                  <li>All editing and publishing permissions.</li>
                  <li>All instructor earnings pages and payout settings.</li>
                  <li>Instructor messaging from now on (students will still see past messages).</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">What stays</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All your courses remain published and accessible to enrolled students.</li>
                  <li>All your existing messages remain visible to students and admins.</li>
                  <li>Administrators can still access all of your agreements, payouts, and earnings records.</li>
                  <li>Your teaching history and contributions remain intact for reporting and certificates.</li>
                  <li>Admins can reassign your courses to another instructor at any time.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">What happens internally</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your account is soft-deleted and anonymized.</li>
                  <li>Your email and phone are freed so they can be reused on a new account.</li>
                  <li>All InstructorAgreement, earnings, payout requests, and PDF documents are preserved.</li>
                  <li>Your courses are marked as orphaned until an admin assigns a new owner.</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                This action cannot be undone. If you need to teach again in the future, you will have to register
                a new instructor account and the admin team may reassign courses to you.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => !deletingAccount && setShowDeleteModal(false)}
                className="flex-1 btn-secondary"
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting account...' : 'Delete My Instructor Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
