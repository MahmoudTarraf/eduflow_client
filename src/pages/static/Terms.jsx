
import React from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Terms = () => {
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
          axios.get('/api/policies/public/terms'),
          axios.get('/api/admin/settings/public').catch(() => ({ data: null }))
        ]);

        if (isMounted && policyRes.data?.success && policyRes.data.data) {
          setContent(policyRes.data.data.content || '');
          setUpdatedAt(policyRes.data.data.updatedAt || '');
        } else if (isMounted) {
          setError('Failed to load terms of service.');
        }

        if (isMounted && settingsRes.data?.data) {
          const settings = settingsRes.data.data;
          setPlatformEmail(settings.platformEmail || '');
          setPlatformName(settings.platformName || 'EduFlow');
        }
      } catch (err) {
        console.error('Error loading terms of service:', err);
        if (isMounted) {
          setError('Failed to load terms of service.');
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
            {t('termsOfServiceTitle') || 'Terms of Service'}
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
                {t('termsIntro') || 'Please read these terms carefully before using EduFlow Academy'}
              </p>

              {/* <section className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('agreementToTerms') || 'Agreement to Terms'}
                  </h2>
                  <p className="mt-2">
                    {t('agreementText')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('acceptanceOfTerms') || 'Acceptance of Terms'}
                  </h2>
                  <p className="mt-2">
                    {t('acceptanceContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('userAccounts') || 'User Accounts'}
                  </h2>
                  <p className="mt-2">
                    {t('userAccountsContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('courseAccess') || 'Course Access and Content'}
                  </h2>
                  <p className="mt-2">
                    {t('courseAccessContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('paymentsAndRefunds') || 'Payments and Refunds'}
                  </h2>
                  <p className="mt-2">
                    {t('paymentsContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('prohibitedActivities') || 'Prohibited Conduct'}
                  </h2>
                  <p className="mt-2">
                    {t('prohibitedContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('intellectualProperty') || 'Intellectual Property'}
                  </h2>
                  <p className="mt-2">
                    {t('intellectualPropertyContent')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('studentResponsibilities') || 'Student Responsibilities'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('studentResp1')}</li>
                    <li>{t('studentResp2')}</li>
                    <li>{t('studentResp3')}</li>
                    <li>{t('studentResp4')}</li>
                    <li>{t('studentResp5')}</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('instructorResponsibilities') || 'Instructor Responsibilities'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('instructorResp1')}</li>
                    <li>{t('instructorResp2')}</li>
                    <li>{t('instructorResp3')}</li>
                    <li>{t('instructorResp4')}</li>
                    <li>{t('instructorResp5')}</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('platformRights') || 'Platform Rights'}
                  </h2>
                  <ul className={`mt-2 list-disc ${isRTL ? 'pr-6' : 'pl-6'} space-y-1`}>
                    <li>{t('platformRight1')}</li>
                    <li>{t('platformRight2')}</li>
                    <li>{t('platformRight3')}</li>
                    <li>{t('platformRight4')}</li>
                    <li>{t('platformRight5')}</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('limitationOfLiability') || 'Limitation of Liability'}
                  </h2>
                  <p className="mt-2">
                    {t('liabilityText1')}
                  </p>
                  <p className="mt-2">
                    {t('liabilityText2')}
                  </p>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-4">
                    {t('disputeResolution') || 'Dispute Resolution'}
                  </h2>
                  <p className="mt-2">
                    {t('disputeText')}
                  </p>
                </div>
              </section> */}
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
                  {t('questionsAboutTerms') || 'Questions About These Terms?'}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {t('termsContactText') ||
                    'Do you have questions about these terms? Contact our support team at:'}
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

export default Terms;

