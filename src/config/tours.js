// Tour configurations for different pages
// These are now functions that accept a translation function

export const getHomeTour = (t) => [
  {
    target: 'body',
    title: t('homeTourWelcomeTitle'),
    content: t('homeTourWelcomeContent'),
    disableBeacon: true,
    placement: 'center'
  },
  {
    target: 'nav',
    title: t('homeTourNavTitle'),
    content: t('homeTourNavContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'nav .hidden.md\\:flex button:nth-child(2)',
    title: t('homeTourCoursesTitle'),
    content: t('homeTourCoursesContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'nav .hidden.md\\:flex button:nth-child(3)',
    title: t('homeTourInstructorsTitle'),
    content: t('homeTourInstructorsContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'nav .hidden.md\\:flex button:nth-child(4)',
    title: t('homeTourAboutTitle'),
    content: t('homeTourAboutContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'nav .hidden.md\\:flex button:nth-child(5)',
    title: t('homeTourContactTitle'),
    content: t('homeTourContactContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'nav .flex.items-center.gap-4',
    title: t('homeTourUserActionsTitle'),
    content: t('homeTourUserActionsContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '.swiper',
    title: t('homeTourHeroTitle'),
    content: t('homeTourHeroContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '#courses',
    title: t('homeTourFeaturedTitle'),
    content: t('homeTourFeaturedContent'),
    placement: 'top',
    disableBeacon: false
  }
];

// For backward compatibility, export the default (English) version
export const homeTour = getHomeTour((key) => key);

export const getCourseDetailsTour = (t) => [
  {
    target: 'body',
    title: t('courseDetailsTourWelcomeTitle'),
    content: t('courseDetailsTourWelcomeContent'),
    disableBeacon: true,
    placement: 'center'
  },
  {
    target: 'main > div:first-child',
    title: t('courseDetailsTourInfoTitle'),
    content: t('courseDetailsTourInfoContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '.lg\\:col-span-1',
    title: t('courseDetailsTourSectionsTitle'),
    content: t('courseDetailsTourSectionsContent'),
    placement: 'right',
    disableBeacon: false
  },
  {
    target: '[data-tour="certificates"], nav a[href*="certificates"], .max-w-7xl',
    title: t('courseDetailsTourCertificateTitle'),
    content: t('courseDetailsTourCertificateContent'),
    placement: 'top',
    disableBeacon: false
  }
];

export const courseDetailsTour = getCourseDetailsTour((key) => key);

export const instructorDashboardTour = [
  {
    target: '.dashboard-stats',
    content: 'View your course statistics at a glance.',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '.create-course-btn',
    content: 'Click here to create a new course.',
    placement: 'bottom'
  },
  {
    target: '.my-courses-section',
    content: 'Manage all your courses from this section.',
    placement: 'top'
  },
  {
    target: '.earnings-link',
    content: 'Track your earnings and payment history here.',
    placement: 'left'
  },
  {
    target: '.grading-link',
    content: 'Grade student assignments and projects from this section.',
    placement: 'left'
  },
  {
    target: '.instructor-agreement',
    content: 'Access your signed instructor agreement anytime.',
    placement: 'top'
  }
];

export const getStudentDashboardTour = (t) => [
  {
    target: 'body',
    title: t('studentDashboardTourWelcomeTitle'),
    content: t('studentDashboardTourWelcomeContent'),
    disableBeacon: true,
    placement: 'center'
  },
  {
    target: '.card',
    title: t('studentDashboardTourCoursesTitle'),
    content: t('studentDashboardTourCoursesContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '.grid',
    title: t('studentDashboardTourCardsTitle'),
    content: t('studentDashboardTourCardsContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: 'a[href="/student/payment-history"]',
    title: t('studentDashboardTourPaymentTitle'),
    content: t('studentDashboardTourPaymentContent'),
    placement: 'top',
    disableBeacon: false
  },
  {
    target: '.max-w-7xl',
    title: t('studentDashboardTourDiscoverTitle'),
    content: t('studentDashboardTourDiscoverContent'),
    placement: 'top',
    disableBeacon: false
  },
  {
    target: '.btn-primary',
    title: t('studentDashboardTourBrowseTitle'),
    content: t('studentDashboardTourBrowseContent'),
    placement: 'top',
    disableBeacon: false
  },
  {
    target: 'nav a[href="/messages"]',
    title: t('studentDashboardTourMessagesTitle'),
    content: t('studentDashboardTourMessagesContent'),
    placement: 'left',
    disableBeacon: false
  }
];

export const studentDashboardTour = getStudentDashboardTour((key) => key);

export const profileTour = [
  {
    target: '.profile-header',
    content: 'Manage your profile information and avatar.',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '.edit-profile-btn',
    content: 'Click here to edit your profile details.',
    placement: 'bottom'
  },
  {
    target: '.profile-stats',
    content: 'View your activity statistics and achievements.',
    placement: 'top'
  }
];

export const settingsTour = [
  {
    target: '.settings-tabs',
    content: 'Navigate between different settings sections.',
    disableBeacon: true,
    placement: 'right'
  },
  {
    target: '.profile-settings',
    content: 'Update your personal information and preferences.',
    placement: 'left'
  },
  {
    target: '.payment-receivers',
    content: 'For instructors: Configure your payment receiver details.',
    placement: 'left'
  },
  {
    target: '.save-settings-btn',
    content: 'Don\'t forget to save your changes!',
    placement: 'top'
  }
];

export const getMyAchievementsTour = (t) => [
  {
    target: 'body',
    title: t('achievementsTourWelcomeTitle'),
    content: t('achievementsTourWelcomeContent'),
    disableBeacon: true,
    placement: 'center'
  },
  {
    target: '[data-tour="achievements-header"]',
    title: t('achievementsTourHeaderTitle'),
    content: t('achievementsTourHeaderContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '[data-tour="achievements-points-card"]',
    title: t('achievementsTourPointsTitle'),
    content: t('achievementsTourPointsContent'),
    placement: 'bottom',
    disableBeacon: false
  },
  {
    target: '[data-tour="achievements-activities"]',
    title: t('achievementsTourActivitiesTitle'),
    content: t('achievementsTourActivitiesContent'),
    placement: 'top',
    disableBeacon: false
  },
  {
    target: '[data-tour="achievements-badges"]',
    title: t('achievementsTourBadgesTitle'),
    content: t('achievementsTourBadgesContent'),
    placement: 'top',
    disableBeacon: false
  },
  {
    target: '[data-tour="achievements-rewards"]',
    title: t('achievementsTourMotivationTitle'),
    content: t('achievementsTourMotivationContent'),
    placement: 'top',
    disableBeacon: false
  }
];

export const myAchievementsTour = getMyAchievementsTour((key) => key);

// Tour page relationships for multi-page flow
export const tourFlow = {
  home: {
    next: 'dashboard'
  },
  dashboard: {
    prev: 'home',
    next: 'courseDetails'
  },
  courseDetails: {
    prev: 'dashboard',
    next: null
  }
};
