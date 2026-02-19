
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Facebook, Github, Linkedin, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [platformName, setPlatformName] = React.useState('EduFlow');
  const [platformEmail, setPlatformEmail] = React.useState('');
  const [platformIntro, setPlatformIntro] = React.useState('');
  const [socialLinks, setSocialLinks] = React.useState({
    facebookUrl: '',
    githubUrl: '',
    linkedinUrl: ''
  });
  const [loadingSettings, setLoadingSettings] = React.useState(true);

  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  const [levels, setLevels] = React.useState([]);
  const [loadingLevels, setLoadingLevels] = React.useState(false);

  const [showContactModal, setShowContactModal] = React.useState(false);
  const [adminContact, setAdminContact] = React.useState(null);
  const [loadingAdminContact, setLoadingAdminContact] = React.useState(false);
  const [contactSubject, setContactSubject] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [sendingContact, setSendingContact] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadPublicSettings = async () => {
      try {
        setLoadingSettings(true);
        const res = await axios.get('/api/admin/settings/public');
        if (isMounted && res.data?.success && res.data.data) {
          const data = res.data.data;
          if (data.platformName) {
            setPlatformName(data.platformName);
          }
          if (data.platformEmail) {
            setPlatformEmail(data.platformEmail);
          }
          if (typeof data.platformIntro === 'string') {
            setPlatformIntro(data.platformIntro);
          }

          setSocialLinks({
            facebookUrl: data.facebookUrl || '',
            githubUrl: data.githubUrl || '',
            linkedinUrl: data.linkedinUrl || ''
          });
        }
      } catch (error) {
        console.error('Failed to load public settings for footer:', error);
      } finally {
        if (isMounted) {
          setLoadingSettings(false);
        }
      }
    };

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await axios.get('/api/categories');
        const list = res.data?.categories || [];
        setCategories(list.slice(0, 3));
      } catch (error) {
        console.error('Failed to load categories for footer:', error);
        setCategories([]);
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    const loadLevels = async () => {
      try {
        setLoadingLevels(true);
        const res = await axios.get('/api/levels');
        const list = res.data?.levels || [];
        setLevels(list.slice(0, 3));
      } catch (error) {
        console.error('Failed to load levels for footer:', error);
        setLevels([]);
      } finally {
        if (isMounted) {
          setLoadingLevels(false);
        }
      }
    };

    loadPublicSettings();
    loadCategories();
    loadLevels();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAdminContact = React.useCallback(async () => {
    try {
      setLoadingAdminContact(true);
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const res = await axios.get('/api/messages/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allContacts = res.data?.contacts || [];
      const admin = allContacts.find(c => c.role === 'admin');
      setAdminContact(admin || null);
    } catch (error) {
      console.error('Failed to load admin contact for footer:', error);
    } finally {
      setLoadingAdminContact(false);
    }
  }, []);

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setContactSubject('');
    setContactMessage('');
  };

  const handleOpenContactModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setShowContactModal(true);
    if (!adminContact && !loadingAdminContact) {
      await fetchAdminContact();
    }
  };

  const handleSubmitContact = async event => {
    event.preventDefault();

    const trimmedSubject = contactSubject.trim();
    const trimmedMessage = contactMessage.trim();

    if (trimmedSubject.length < 2) {
      toast.error('Subject must be at least 2 characters');
      return;
    }

    if (trimmedMessage.length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    if (!user) {
      toast.error('Please sign in to contact support');
      return;
    }

    if (!adminContact) {
      if (platformEmail) {
        window.location.href = `mailto:${platformEmail}?subject=${encodeURIComponent(trimmedSubject)}&body=${encodeURIComponent(trimmedMessage)}`;
        handleCloseContactModal();
        return;
      }
      toast.error('Support is temporarily unavailable. Please try again later.');
      return;
    }

    try {
      setSendingContact(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication error. Please log in again.');
        return;
      }

      await axios.post(
        '/api/messages',
        {
          recipient: adminContact._id,
          subject: trimmedSubject,
          content: trimmedMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Your message has been sent to the admin.');
      handleCloseContactModal();
    } catch (error) {
      console.error('Footer contact message error:', error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Failed to send message. Please try again.';
      toast.error(message);
    } finally {
      setSendingContact(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const resolvedFacebookUrl = socialLinks.facebookUrl || 'https://facebook.com';
  const resolvedGithubUrl = socialLinks.githubUrl || 'https://github.com';
  const resolvedLinkedinUrl = socialLinks.linkedinUrl || 'https://linkedin.com';

  const displayPlatformName = platformName || t('eduflowAcademy') || 'EduFlow Academy';
  const displayIntro =
    platformIntro ||
    t('eduflowTagline') ||
    t('footerTagline') ||
    'Empowering learners and instructors with a modern online education platform.';

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className={`grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          {/* EduFlow / Platform column */}
          <div className="md:col-span-2 lg:col-span-2 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {displayPlatformName}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-md">
              {displayIntro}
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-md">
              {t('joinThousands') ||
                'Join thousands of students who are actively taking courses and improving their careers.'}
            </p>
            {platformEmail && (
              <p className="mt-2 text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <a
                  href={`mailto:${platformEmail}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline break-all"
                >
                  {platformEmail}
                </a>
              </p>
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('followUs') || 'Follow Us'}
              </p>
              <div className="mt-2 flex items-center space-x-3 text-gray-400">
                <a
                  href={resolvedFacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={resolvedGithubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href={resolvedLinkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase mb-4">
              {t('categories') || 'Categories'}
            </h3>
            <ul className="space-y-2 text-sm">
              {loadingCategories && (
                <li className="text-gray-400 dark:text-gray-500 text-xs">
                  {t('loading') || 'Loading...'}
                </li>
              )}
              {!loadingCategories &&
                categories.map(category => (
                  <li key={category._id}>
                    <Link
                      to={`/?category=${encodeURIComponent(category.slug)}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              {!loadingCategories && categories.length === 0 && (
                <li className="text-gray-400 dark:text-gray-500 text-xs">
                  {t('noCategoriesYet') || 'Categories will appear here once created.'}
                </li>
              )}
            </ul>
          </div>

          {/* Levels */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase mb-4">
              {t('levels') || 'Levels'}
            </h3>
            <ul className="space-y-2 text-sm">
              {loadingLevels && (
                <li className="text-gray-400 dark:text-gray-500 text-xs">
                  {t('loading') || 'Loading...'}
                </li>
              )}
              {!loadingLevels &&
                levels.map(level => (
                  <li key={level._id}>
                    <Link
                      to={`/?level=${encodeURIComponent(level.slug)}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {level.name}
                    </Link>
                  </li>
                ))}
              {!loadingLevels && levels.length === 0 && (
                <li className="text-gray-400 dark:text-gray-500 text-xs">
                  {t('noLevelsYet') || 'Levels will appear here once created.'}
                </li>
              )}
            </ul>
          </div>

          {/* Legal + Contact Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase mb-3">
                {t('legal') || 'Legal'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('termsOfService') || 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('privacyPolicy') || 'Privacy Policy'}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase mb-3">
                {t('contactInfo') || 'Contact Info'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('availableViaMessage') ||
                  'Have a question or need help? Our support team is available through the platform messaging system.'}
              </p>
              <button
                type="button"
                onClick={handleOpenContactModal}
                disabled={loadingSettings}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('contactUs') || 'Contact Us'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom row: copyright + quick links */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          <p className="text-sm text-gray-500 dark:text-gray-500 text-center md:text-left">
            &copy; {currentYear} {displayPlatformName}. {t('allRightsReserved') || 'All rights reserved.'}
          </p>

          <div className={`flex flex-wrap items-center gap-3 text-sm ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            {/* <span className="text-gray-500 dark:text-gray-400">
              {t('quickLinks') || 'Quick Links'}:
            </span> */}
            <Link
              to="/faq"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('faq') || 'FAQ'}
            </Link>
            <Link
              to="/help"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('helpCenter') || 'Help Center'}
            </Link>
            <Link
              to="/about"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('aboutUsTitle') || 'About'}
            </Link>
            <Link
              to="/terms"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('termsOfService') || 'Terms of Service'}
            </Link>
            <Link
              to="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('privacyPolicy') || 'Privacy Policy'}
            </Link>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('contactSupport') || 'Contact Support'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('contactSupportSubtitle') || 'Send a quick message to the platform administrators.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseContactModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loadingAdminContact && !adminContact && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t('loading') || 'Loading'}...
              </p>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('subject') || 'Subject'}
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={event => setContactSubject(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  placeholder={t('contactSubjectPlaceholder') || 'How can we help you?'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('message') || 'Message'}
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={event => setContactMessage(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y"
                  placeholder={t('contactMessagePlaceholder') || 'Describe your question or issue in as much detail as possible.'}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs">
                  {t('contactSupportHint') ||
                    'Your message will be delivered to the admin inbox. You may also receive a copy via email.'}
                </p>
                <button
                  type="submit"
                  disabled={sendingContact}
                  className="inline-flex items-center px-4 py-1.5 rounded-md text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingContact && (
                    <span className="mr-2 inline-block h-4 w-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                  )}
                  {sendingContact ? t('sending') || 'Sending...' : t('sendMessage') || 'Send message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;

