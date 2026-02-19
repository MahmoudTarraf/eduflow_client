import React, { useState, useEffect, createContext, useContext } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';

// Tour Context to manage tour state across pages
const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [stepIndex, setStepIndex] = useState(0);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [nextPage, setNextPage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Load tour progress from localStorage
  useEffect(() => {
    const tourData = localStorage.getItem('multiPageTourData');
    if (tourData) {
      try {
        const { active, page, step } = JSON.parse(tourData);
        if (active) {
          setIsTourActive(true);
          setCurrentPage(page);
          setStepIndex(step);
        }
      } catch (error) {
        console.error('Error loading tour data:', error);
      }
    }
  }, []);

  // Save tour progress to localStorage
  useEffect(() => {
    if (isTourActive) {
      localStorage.setItem('multiPageTourData', JSON.stringify({
        active: isTourActive,
        page: currentPage,
        step: stepIndex
      }));
    } else {
      localStorage.removeItem('multiPageTourData');
    }
  }, [isTourActive, currentPage, stepIndex]);

  const startTour = (page = 'home') => {
    setIsTourActive(true);
    setCurrentPage(page);
    setStepIndex(0);
  };

  const stopTour = () => {
    setIsTourActive(false);
    setStepIndex(0);
    setShowContinueModal(false);
    localStorage.removeItem('multiPageTourData');
    localStorage.setItem('tourCompleted', 'true');
  };

  const resetTour = () => {
    localStorage.removeItem('tourCompleted');
    localStorage.removeItem('multiPageTourData');
    startTour('home');
    navigate('/');
  };

  const continueTourToPage = (pageName, path) => {
    setNextPage(pageName);
    setShowContinueModal(false);
    setCurrentPage(pageName);
    setStepIndex(0);
    navigate(path);
  };

  const promptContinue = (pageName) => {
    setNextPage(pageName);
    setShowContinueModal(true);
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentPage,
        stepIndex,
        setStepIndex,
        startTour,
        stopTour,
        resetTour,
        continueTourToPage,
        promptContinue,
        showContinueModal,
        setShowContinueModal,
        nextPage
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

// Multi-page tour component
const MultiPageTour = ({ steps, pageName, nextPageInfo }) => {
  const {
    isTourActive,
    currentPage,
    stepIndex,
    setStepIndex,
    stopTour,
    promptContinue
  } = useTour();

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // If there's a next page in the tour, prompt to continue
      if (nextPageInfo && status === STATUS.FINISHED) {
        promptContinue(nextPageInfo.name);
      } else {
        stopTour();
      }
    }
  };

  const isActivePage = isTourActive && currentPage === pageName;

  if (!isActivePage) return null;

  return (
    <Joyride
      steps={steps}
      run={true}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5',
          textColor: '#1F2937',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.6',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: '12px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: '14px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: nextPageInfo ? 'Next Page' : 'Finish Tour',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

// Tour button component
export const TourButton = () => {
  const { isTourActive, startTour, stopTour, resetTour } = useTour();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  const handleStartTour = () => {
    const tourCompleted = localStorage.getItem('tourCompleted');
    if (tourCompleted) {
      // Show options menu
      setShowMenu(true);
    } else {
      // Start tour from current page
      const currentPageName = getCurrentPageName(location.pathname);
      startTour(currentPageName);
    }
  };

  const getCurrentPageName = (pathname) => {
    if (pathname === '/') return 'home';
    if (pathname.includes('/student')) return 'dashboard';
    if (pathname.includes('/instructor')) return 'dashboard';
    if (pathname.includes('/courses/')) return 'courseDetails';
    return 'home';
  };

  return (
    <>
      <button
        onClick={handleStartTour}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 group"
        title="Take a Tour"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="font-medium hidden sm:inline">Take a Tour</span>
      </button>

      {/* Menu overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tour Guide
              </h3>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You've already completed the tour. Would you like to restart from the beginning or continue from the current page?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowMenu(false);
                  resetTour();
                }}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Restart Complete Tour
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  const currentPageName = getCurrentPageName(location.pathname);
                  startTour(currentPageName);
                }}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Tour Current Page
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Continue modal component
export const TourContinueModal = () => {
  const {
    showContinueModal,
    setShowContinueModal,
    nextPage,
    continueTourToPage,
    stopTour
  } = useTour();

  if (!showContinueModal) return null;

  const getNextPageInfo = () => {
    switch (nextPage) {
      case 'dashboard':
        return {
          title: 'Continue to Dashboard',
          description: 'Learn how to navigate your dashboard and manage your courses.',
          path: '/student/dashboard'
        };
      case 'payment':
        return {
          title: 'Continue to Payment Guide',
          description: 'Learn how to purchase course sections and manage payments.',
          path: '/payment-methods'
        };
      case 'courseDetails':
        return {
          title: 'Continue to Course Details',
          description: 'Learn about course structure, lectures, assignments, and projects.',
          path: '/courses'
        };
      default:
        return null;
    }
  };

  const pageInfo = getNextPageInfo();

  if (!pageInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🎉 Great Progress!
        </h3>
        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
          {pageInfo.title}
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {pageInfo.description}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => continueTourToPage(nextPage, pageInfo.path)}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Continue Tour
          </button>
          <button
            onClick={() => {
              setShowContinueModal(false);
              stopTour();
            }}
            className="w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Finish Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiPageTour;
