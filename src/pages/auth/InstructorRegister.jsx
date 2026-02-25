import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Lock, Phone, Globe, Award,
  Image, CheckCircle, FileText, Video,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';

const InstructorRegister = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'he' || i18n.language === 'fa';
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreementData, setAgreementData] = useState({
    text: '',
    instructorPercentage: 80,
    adminPercentage: 20
  });

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    expertise: [],
    customExpertise: '',
    profilePhoto: null,
    // Step 2
    otp: '',
    emailVerified: false,
    // Step 3
    agreedToTerms: false,
    signature: '',
    agreementPdfUrl: '',
    // Step 4
    introVideoUrl: '',
    // Progress
    registrationProgress: 1
  });

  const totalSteps = 5;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('instructorRegistrationProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        // Never restore step 5 from localStorage — require server validation
        const savedStep = parsed.currentStep || 1;
        if (savedStep < 5) {
          setFormData(parsed.formData || formData);
          setCurrentStep(savedStep);
        } else {
          // Step 5 saved — restore form data (for email) but stay at step 1
          // to force re-check via handleStep1Submit
          if (parsed.formData) {
            setFormData(parsed.formData);
          }
          setCurrentStep(1);
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (currentStep >= 5) {
      // Don't persist step 5 — it should always be server-validated
      localStorage.removeItem('instructorRegistrationProgress');
      return;
    }
    const progressData = {
      formData,
      currentStep
    };
    localStorage.setItem('instructorRegistrationProgress', JSON.stringify(progressData));
  }, [formData, currentStep]);

  // Fetch agreement text when reaching step 3
  useEffect(() => {
    if (currentStep === 3) {
      fetchAgreementText();
    }
  }, [currentStep]);

  const fetchAgreementText = async () => {
    try {
      const response = await axios.get('/api/instructor/agreement-text');
      if (response.data.success) {
        setAgreementData({
          text: response.data.data.text,
          instructorPercentage: response.data.data.instructorPercentage,
          adminPercentage: response.data.data.adminPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error(t('instructorRegToastAgreementLoadFailed'));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpertiseToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(area)
        ? prev.expertise.filter(e => e !== area)
        : [...prev.expertise, area]
    }));
  };

  const validateStep1 = () => {
    const { name, email, password, confirmPassword, phone, country, expertise } = formData;

    if (!name || !email || !password || !confirmPassword || !phone || !country) {
      toast.error(t('instructorRegToastFillRequired'));
      return false;
    }

    if (password !== confirmPassword) {
      toast.error(t('instructorRegToastPasswordsMismatch'));
      return false;
    }

    // Strong password rules for instructors
    if (!password || password.length < 12) {
      toast.error(t('instructorRegToastPasswordMinLength'));
      return false;
    }
    if (!/[a-z]/.test(password)) {
      toast.error(t('instructorRegToastPasswordRequireLower'));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error(t('instructorRegToastPasswordRequireUpper'));
      return false;
    }
    if (!/[0-9]/.test(password)) {
      toast.error(t('instructorRegToastPasswordRequireNumber'));
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error(t('instructorRegToastPasswordRequireSymbol'));
      return false;
    }

    // Phone validation: starts with 09 and exactly 10 digits
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      toast.error(t('instructorRegToastPhoneInvalid'));
      return false;
    }

    if (expertise.length === 0) {
      toast.error(t('instructorRegToastExpertiseRequired'));
      return false;
    }

    if (expertise.includes('Other') && !formData.customExpertise.trim()) {
      toast.error(t('instructorRegToastCustomExpertiseRequired'));
      return false;
    }

    // Name should contain only letters and spaces (no numbers or special characters)
    const nameClean = (name || '').trim();
    const lettersOnlyRegex = /^[\p{L}\s]+$/u;
    if (!lettersOnlyRegex.test(nameClean)) {
      toast.error(t('instructorRegToastNameLettersOnly'));
      return false;
    }

    return true;
  };

  const handleRestartRegistration = async () => {
    if (!formData.email) {
      toast.error(t('instructorRegToastEnterEmailFirst'));
      return;
    }

    const confirmRestart = window.confirm(
      t('instructorRegConfirmRestartTitle')
    );

    if (!confirmRestart) return;

    try {
      setLoading(true);
      await axios.delete('/api/auth/instructor-application', {
        data: { email: formData.email }
      });

      // Clear local storage
      localStorage.removeItem('instructorRegistrationProgress');

      // Reset form
      setFormData({
        name: '',
        email: formData.email, // Keep email
        password: '',
        confirmPassword: '',
        phone: '',
        country: '',
        expertise: [],
        customExpertise: '',
        profilePhoto: null,
        otp: '',
        emailVerified: false,
        agreedToTerms: false,
        signature: '',
        agreementPdfUrl: '',
        introVideoUrl: '',
        registrationProgress: 1
      });
      setCurrentStep(1);

      toast.success(t('instructorRegToastRestarted'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('instructorRegToastRestartFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    try {
      setLoading(true);
      // Register instructor and send verification email
      // If "Other" is selected, replace it with the custom expertise value
      const expertiseToSend = formData.expertise.map(e =>
        e === 'Other' ? formData.customExpertise.trim() : e
      );

      const response = await axios.post('/api/auth/register-instructor', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        expertise: expertiseToSend,
        profilePhoto: formData.profilePhoto
      });

      if (response.data.success) {
        if (response.data.isExisting) {
          // Handle existing application
          const { registrationProgress, emailVerified, status } = response.data;

          if (status === 'approved') {
            toast.success(t('instructorRegToastApproved'));
            navigate('/login');
            return;
          }

          // If all steps completed (registrationProgress >= 5), show step 5
          if (status === 'pending_review' && registrationProgress >= 5) {
            toast.info(t('instructorRegToastPendingReview'));
            setCurrentStep(5);
            return;
          }

          // Resume from where they left off
          // Restore name from server for returning users
          if (response.data.name) {
            handleInputChange('name', response.data.name);
          }
          toast.info(t('instructorRegToastResumeExisting'));
          if (registrationProgress === 1 || !emailVerified) {
            setCurrentStep(2);
          } else if (registrationProgress === 2) {
            setCurrentStep(3);
          } else if (registrationProgress === 3) {
            setCurrentStep(4);
          } else if (registrationProgress >= 4) {
            // All steps completed — show step 5 (pending review)
            setCurrentStep(5);
          }
        } else {
          toast.success(t('instructorRegToastVerificationSent'));
          setCurrentStep(2);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('instructorRegToastRegistrationFailed');
      toast.error(errorMsg);

      // Offer restart option if there's a conflict
      if (error.response?.status === 400 && errorMsg.includes('exists')) {
        const shouldRestart = window.confirm(
          t('instructorRegConfirmResumeExisting')
        );
        if (shouldRestart) {
          handleRestartRegistration();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!formData.otp) {
      toast.error(t('instructorRegToastEnterOTP'));
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/auth/verify-instructor-email', {
        email: formData.email,
        otp: formData.otp
      });

      if (response.data.success) {
        toast.success(t('instructorRegToastEmailVerified'));
        handleInputChange('emailVerified', true);
        setCurrentStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('instructorRegToastVerificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    if (!formData.agreedToTerms) {
      toast.error(t('instructorRegToastAgreeTerms'));
      return;
    }

    if (!formData.signature) {
      toast.error(t('instructorRegToastSignatureRequired'));
      return;
    }

    // Signature must contain only letters and spaces
    const signatureTrimmed = (formData.signature || '').trim();
    const lettersOnlyRegex = /^[\p{L}\s]+$/u;
    if (!lettersOnlyRegex.test(signatureTrimmed)) {
      toast.error(t('instructorRegToastSignatureLettersOnly'));
      return;
    }

    // Signature must exactly match the full name (ignoring extra whitespace)
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const normalizedName = normalize(formData.name);
    const normalizedSignature = normalize(formData.signature);

    if (normalizedName && normalizedSignature !== normalizedName) {
      toast.error(t('instructorRegToastSignatureMustMatchName'));
      return;
    }

    try {
      setLoading(true);
      const uploadSessionId = Date.now().toString();

      const pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/video-upload-jobs/${uploadSessionId}`);
          const job = res.data?.data;
          if (job && typeof job.percent === 'number') {
            toast.loading(`${t('instructorRegGeneratingAgreement') || 'Generating'} (${job.percent}%)`, { id: 'pdf-generation' });
          }
        } catch (e) { }
      }, 2000);

      toast.loading(t('instructorRegGeneratingAgreement') || 'Generating...', { id: 'pdf-generation' });

      // Generate PDF agreement
      const response = await axios.post('/api/instructor/generate-agreement', {
        email: formData.email,
        name: formData.name,
        signature: formData.signature,
        uploadSessionId
      });

      clearInterval(pollInterval);

      if (response.data.success) {
        toast.success(t('instructorRegToastAgreementSigned'), { id: 'pdf-generation' });
        handleInputChange('agreementPdfUrl', response.data.pdfUrl);
        setCurrentStep(4);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('instructorRegToastAgreementFailed'), { id: 'pdf-generation' });
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async () => {
    if (!formData.introVideoUrl) {
      toast.error(t('instructorRegToastVideoRequired'));
      return;
    }

    try {
      setLoading(true);
      // Save video URL
      await axios.post('/api/instructor/save-intro-video', {
        email: formData.email,
        videoUrl: formData.introVideoUrl
      });

      toast.success(t('instructorRegToastVideoSaved'));
      setCurrentStep(5);

      // Clear localStorage
      localStorage.removeItem('instructorRegistrationProgress');
    } catch (error) {
      toast.error(error.response?.data?.message || t('instructorRegToastVideoSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) handleStep1Submit();
    else if (currentStep === 2) handleStep2Submit();
    else if (currentStep === 3) handleStep3Submit();
    else if (currentStep === 4) handleStep4Submit();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const expertiseAreas = [
    { value: 'Programming', labelKey: 'instructorRegExpertiseProgramming' },
    { value: 'Web Development', labelKey: 'instructorRegExpertiseWebDevelopment' },
    { value: 'Mobile Development', labelKey: 'instructorRegExpertiseMobileDevelopment' },
    { value: 'Data Science', labelKey: 'instructorRegExpertiseDataScience' },
    { value: 'Machine Learning', labelKey: 'instructorRegExpertiseMachineLearning' },
    { value: 'Cybersecurity', labelKey: 'instructorRegExpertiseCybersecurity' },
    { value: 'Cloud Computing', labelKey: 'instructorRegExpertiseCloudComputing' },
    { value: 'DevOps', labelKey: 'instructorRegExpertiseDevOps' },
    { value: 'UI/UX Design', labelKey: 'instructorRegExpertiseUIUX' },
    { value: 'Digital Marketing', labelKey: 'instructorRegExpertiseDigitalMarketing' },
    { value: 'Business', labelKey: 'instructorRegExpertiseBusiness' },
    { value: 'Languages', labelKey: 'instructorRegExpertiseLanguages' },
    { value: 'Other', labelKey: 'instructorRegExpertiseOther' }
  ];

  return (
    <PageTransition>
      <div
        className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('instructorRegStepLabel', { current: currentStep, total: totalSteps })}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('instructorRegProgressPercent', { percent: progressPercent })}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <Step1 formData={formData} handleInputChange={handleInputChange} handleExpertiseToggle={handleExpertiseToggle} expertiseAreas={expertiseAreas} />}
              {currentStep === 2 && <Step2 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 3 && <Step3 formData={formData} handleInputChange={handleInputChange} agreementData={agreementData} />}
              {currentStep === 4 && <Step4 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 5 && <Step5 />}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'transform-flip-x' : ''}`} />
                  <span>{t('back')}</span>
                </button>

                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <span>
                        {currentStep === 4
                          ? t('completeLabel')
                          : t('continueLabel')}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'transform-flip-x' : ''}`} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

// Step Components
const Step1 = ({ formData, handleInputChange, handleExpertiseToggle, expertiseAreas }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <User className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('instructorRegStep1Title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('instructorRegStep1Subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('instructorRegFullNameLabel')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('instructorRegFullNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('instructorRegEmailLabel')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('instructorRegEmailPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('instructorRegPasswordLabel')}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('instructorRegPasswordPlaceholder')}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('instructorRegConfirmPasswordLabel')}
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('instructorRegConfirmPasswordPlaceholder')}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('instructorRegPhoneLabel')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('instructorRegPhonePlaceholder')}
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('countryLabel')} *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('enterYourCountry')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('instructorRegExpertiseLabel')}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {expertiseAreas.map(area => (
            <button
              key={area.value}
              type="button"
              onClick={() => handleExpertiseToggle(area.value)}
              className={`px-4 py-2 rounded-lg border-2 transition ${formData.expertise.includes(area.value)
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                }`}
            >
              {t(area.labelKey)}
            </button>
          ))}
        </div>

        {/* Custom Expertise Input */}
        {formData.expertise.includes('Other') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('instructorRegCustomExpertiseLabel')}
            </label>
            <input
              type="text"
              value={formData.customExpertise}
              onChange={(e) => handleInputChange('customExpertise', e.target.value)}
              placeholder={t('instructorRegCustomExpertisePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Step2 = ({ formData, handleInputChange }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <Mail className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('instructorRegStep2Title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('instructorRegStep2Subtitle', { email: formData.email })}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('instructorRegVerificationCodeLabel')}
        </label>
        <input
          type="text"
          value={formData.otp}
          onChange={(e) => handleInputChange('otp', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
          placeholder={t('instructorRegVerificationCodePlaceholder')}
          maxLength={6}
        />
      </div>

      <div className="text-center">
        <button className="text-indigo-600 hover:text-indigo-700 text-sm">
          {t('instructorRegResendCode')}
        </button>
      </div>
    </motion.div>
  );
};

const Step3 = ({ formData, handleInputChange, agreementData }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'he' || i18n.language === 'fa';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <FileText className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('instructorRegStep3Title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('instructorRegStep3Subtitle')}
        </p>
      </div>

      {/* Revenue Split Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 mb-3">
          {t('instructorRegRevenueSharingTitle')}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">{t('instructorRegYourShareLabel')}</p>
            <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
              {agreementData.instructorPercentage}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">{t('instructorRegPlatformShareLabel')}</p>
            <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
              {agreementData.adminPercentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Text */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600">
        <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
          {t('instructorRegAgreementHeading')}
        </h4>
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {agreementData.text || 'Loading agreement...'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('instructorRegSignatureLabel')}
        </label>
        <input
          type="text"
          value={formData.signature}
          onChange={(e) => handleInputChange('signature', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-signature text-2xl"
          placeholder={t('instructorRegSignaturePlaceholder')}
        />
      </div>

      <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
        <input
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
          className={`mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${isRTL ? 'ml-2' : 'mr-0'}`}
        />
        <label className={`text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('instructorAgreementCheckbox')}
        </label>
      </div>
    </motion.div>
  );
};

const Step4 = ({ formData, handleInputChange }) => {
  const [limits, setLimits] = React.useState({ maxVideoSizeMB: 500 });
  const { t } = useTranslation();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data?.data?.maxVideoSizeMB) {
          setLimits({ maxVideoSizeMB: res.data.data.maxVideoSizeMB });
        }
      } catch (e) { }
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <Video className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('instructorRegStep4Title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('instructorRegStep4Subtitle')}
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {t('instructorRegVideoInstructions', { maxSize: limits.maxVideoSizeMB })}
        </p>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) {
              // Validate file size (max video size from settings)
              const maxBytes = (limits.maxVideoSizeMB || 500) * 1024 * 1024;
              if (file.size > maxBytes) {
                toast.error(t('instructorRegVideoSizeTooLarge', { maxSize: limits.maxVideoSizeMB }));
                return;
              }

              let pollInterval;
              try {
                toast.loading(t('instructorRegUploadingVideo'), { id: 'video-upload' });

                const uploadData = new FormData();
                uploadData.append('video', file);
                uploadData.append('email', formData.email);

                const uploadSessionId = Date.now().toString();
                uploadData.append('uploadSessionId', uploadSessionId);

                pollInterval = setInterval(async () => {
                  try {
                    const res = await axios.get(`/api/video-upload-jobs/${uploadSessionId}`);
                    const job = res.data?.data;
                    if (job && typeof job.percent === 'number') {
                      toast.loading(t('instructorRegUploadingVideoPercent', { percent: job.percent }), { id: 'video-upload' });
                    }
                  } catch (e) { }
                }, 2000);

                // Upload to local server
                const response = await axios.post('/api/instructor/upload-intro-video', uploadData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                  onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // Only use client progress while it's less than 100 (sending to server)
                    if (percentCompleted < 100) {
                      toast.loading(t('instructorRegUploadingVideoPercent', { percent: percentCompleted }), { id: 'video-upload' });
                    }
                  }
                });

                clearInterval(pollInterval);

                if (response.data.success) {
                  handleInputChange('introVideoUrl', response.data.videoUrl);
                  toast.success(t('instructorRegToastVideoSaved'), { id: 'video-upload' });
                }
              } catch (error) {
                console.error('Video upload error:', error);
                toast.error(error.response?.data?.message || t('instructorRegToastVideoSaveFailed'), { id: 'video-upload' });
              } finally {
                if (pollInterval) clearInterval(pollInterval);
              }
            }
          }}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition"
        >
          {t('instructorRegChooseVideoLabel')}
        </label>
      </div>

      {formData.introVideoUrl && (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span>{t('instructorRegVideoUploadedLabel')}</span>
        </div>
      )}
    </motion.div>
  );
}

const Step5 = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {t('instructorRegStep5Title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        {t('instructorRegStep5Subtitle')}
      </p>
      <button
        onClick={() => navigate('/login')}
        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
      >
        {t('instructorRegGoToLogin')}
      </button>
    </motion.div>
  );
};

export default InstructorRegister;
