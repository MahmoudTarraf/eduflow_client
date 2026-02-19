import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import useCelebration from '../../hooks/useCelebration';
import CelebrationModal from '../../components/common/CelebrationModal';

const Register = () => {
  const { t, i18n } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { celebrationState, celebrate, closeCelebration } = useCelebration();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailCheck, setEmailCheck] = useState({ checkedEmail: '', isDisposable: false });
  const emailCheckTimeoutRef = useRef(null);
  
  
  // Check if current language is RTL
  const isRTL = ['ar', 'he', 'fa'].some((lng) => (i18n.language || '').startsWith(lng));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const emailValue = watch('email');

  // Debounced disposable-email check
  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    const email = (emailValue || '').trim();
    if (!email) {
      setEmailCheck({ checkedEmail: '', isDisposable: false });
      return;
    }

    // Simple pattern check before hitting backend
    const basicPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!basicPattern.test(email)) {
      setEmailCheck({ checkedEmail: email, isDisposable: false });
      return;
    }

    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        // Avoid re-checking the same email repeatedly
        if (email === emailCheck.checkedEmail) return;

        const res = await axios.get('/api/auth/check-email-domain', {
          params: { email }
        });

        const isDisposable = !!res.data?.isDisposable;
        setEmailCheck({ checkedEmail: email, isDisposable });

        if (isDisposable) {
          toast.error('Temporary or disposable emails are not allowed. Please use a valid email address.');
        }
      } catch (err) {
        // Silent fail – backend will still enforce on submit
        console.error('Email domain check failed:', err?.response?.data || err.message);
      }
    }, 600);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [emailValue, emailCheck.checkedEmail]);

  const onSubmit = async (data) => {
    setLoading(true);
    
    if (emailCheck.isDisposable && emailCheck.checkedEmail === (data.email || '').trim()) {
      toast.error('Temporary or disposable emails are not allowed. Please use a valid email address.');
      setLoading(false);
      return;
    }

    // Set role to 'student' by default for this registration form
    data.role = 'student';
    
    const result = await registerUser(data);
    
    if (result.success) {
      // Trigger celebration and navigate immediately
      celebrate({
        eventType: 'signup',
        userName: data.name,
        userRole: 'student',
        eventKey: `user_signup_${data.email}`, // Prevent duplicate celebrations
      });
      
      // Navigate immediately without delay
      navigate('/verify-email');
    }
    
    setLoading(false);
  };

  return (
    <PageTransition>
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t('register')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              {t('login')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('name')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder={t('enterYourFullName')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.name && (
                <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('email')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder={t('enterYourEmail')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.email && (
                <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('phone')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^09\d{8}$/,
                      message: 'Phone number must start with 09 and contain exactly 10 digits (e.g., 0912345678)'
                    }
                  })}
                  type="tel"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder="09XXXXXXXX"
                  maxLength="10"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              {errors.phone && (
                <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Country Field */}
            <div>
              <label
                htmlFor="country"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('countryLabel')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('country')}
                  type="text"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder={t('enterYourCountry')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* City Field */}
            <div>
              <label
                htmlFor="city"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('cityLabel')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('city')}
                  type="text"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder={t('enterYourCity')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* School/University Field */}
            <div>
              <label
                htmlFor="school"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('schoolLabel')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('school')}
                  type="text"
                  className={`input-field ${isRTL ? 'pr-10 text-right rtl' : 'pl-10 text-left ltr'}`}
                  placeholder={t('enterYourSchoolUniversity')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('password')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) => {
                      if (!value || value.length < 8) return 'Password must be at least 8 characters';
                      if (!/[a-z]/.test(value)) return 'Password must include at least one lowercase letter';
                      if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter';
                      if (!/[0-9]/.test(value)) return 'Password must include at least one number';
                      if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include at least one symbol';
                      return true;
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${isRTL ? 'pr-10 pl-10 text-right rtl' : 'pl-10 pr-10 text-left ltr'}`}
                  placeholder={t('enterYourPassword')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
                >
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input-field ${isRTL ? 'pl-10 pr-10 text-right rtl' : 'pl-10 pr-10 text-left ltr'}`}
                  placeholder={t('confirmPassword')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Terms & Policy Agreement */}
          <div className="space-y-3">
            <div className="flex items-start">
              <input
                {...register('agreeToTerms', {
                  required: t('mustAgreeTerms') || 'You must agree to the Terms of Service and Privacy Policy to continue'
                })}
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
              />
              <label className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${isRTL ? 'mr-2 text-right' : 'ml-2 text-left'}`}>
                {t('iAgreeTo')}{' '}
                <Link to="/terms" target="_blank" className="text-primary-600 hover:text-primary-500 underline">
                  {t('termsOfService')}
                </Link>{' '}
                {t('andLabel')}{' '}
                <Link to="/privacy" target="_blank" className="text-primary-600 hover:text-primary-500 underline">
                  {t('privacyPolicy')}
                </Link>
              </label>
            </div>
          </div>
          {errors.agreeToTerms && (
            <p className={`text-sm text-red-600 dark:text-red-400 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {errors.agreeToTerms.message}
            </p>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('loading')}...
                </div>
              ) : (
                t('register')
              )}
            </button>
          </div>
        </form>

        {/* Instructor Registration Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
        >
          <div className="text-center" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {t('wantToTeach')}
            </p>
            <Link
              to="/register/instructor"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {t('becomeInstructor')}
            </Link>
          </div>
        </motion.div>
      </motion.div>
      </div>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationState.isOpen}
        onClose={closeCelebration}
        {...celebrationState}
      />
    </PageTransition>
  );
};

export default Register;
