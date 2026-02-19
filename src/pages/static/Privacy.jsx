
import React from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [content, setContent] = React.useState('');
  const [updatedAt, setUpdatedAt] = React.useState('');
  const [platformEmail, setPlatformEmail] = React.useState('');
  const [platformName, setPlatformName] = React.useState('EduFlow');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [policyRes, settingsRes] = await Promise.all([
          axios.get('/api/policies/public/privacy'),
          axios.get('/api/admin/settings/public').catch(() => ({ data: null }))
        ]);

        if (isMounted && policyRes.data?.success && policyRes.data.data) {
          setContent(policyRes.data.data.content || '');
          setUpdatedAt(policyRes.data.data.updatedAt || '');
        } else if (isMounted) {
          setError('Failed to load privacy policy.');
        }

        if (isMounted && settingsRes.data?.data) {
          const settings = settingsRes.data.data;
          setPlatformEmail(settings.platformEmail || '');
          setPlatformName(settings.platformName || 'EduFlow');
        }
      } catch (err) {
        console.error('Error loading privacy policy:', err);
        if (isMounted) {
          setError('Failed to load privacy policy.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedDate = React.useMemo(() => {
    if (!updatedAt) return '';
    try {
      const d = new Date(updatedAt);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  }, [updatedAt]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t('privacyPolicyTitle') || 'Privacy Policy'}
          </h1>
          {formattedDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('lastUpdated') || 'Last Updated'}: {formattedDate}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className={`mb-10 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('privacyIntro') || 'Your privacy and data security are our top priorities'}
              </p>

              <section className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('introduction') || 'Introduction'}
                  </h2>
                  <p className="mt-2">
                    {t('privacyIntroText')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('informationWeCollect') || 'Information We Collect'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('infoCollect1')}</li>
                    <li>{t('infoCollect2')}</li>
                    <li>{t('infoCollect3')}</li>
                    <li>{t('infoCollect4')}</li>
                    <li>{t('infoCollect5')}</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('howWeUseInfo') || 'How We Use Your Information'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('useInfo1')}</li>
                    <li>{t('useInfo2')}</li>
                    <li>{t('useInfo3')}</li>
                    <li>{t('useInfo4')}</li>
                    <li>{t('useInfo5')}</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('yourRights') || 'Your Rights'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('rights1')}</li>
                    <li>{t('rights2')}</li>
                    <li>{t('rights3')}</li>
                    <li>{t('rights4')}</li>
                    <li>{t('rights5')}</li>
                  </ul>
                </div>
              </section>
            </div>

            {content && (
              <div
                className="prose prose-sm sm:prose max-w-none dark:prose-invert mb-8"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

            {platformEmail && (
              <div className="mt-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('contactUsAboutPrivacy') || 'Have questions about this policy?'}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {t('privacyContactText') ||
                    'Do you have questions about this policy? Contact our support team at:'}
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium break-all">
                  {platformName && (
                    <span className="mr-1">
                      {platformName} -
                    </span>
                  )}
                  <a href={`mailto:${platformEmail}`} className="hover:underline">
                    {platformEmail}
                  </a>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Privacy;

