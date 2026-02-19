import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Custom Tooltip Component with translated step counter
const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
  t,
  isRTL
}) => {
  // Get current theme from localStorage or system preference
  const isDark = document.documentElement.classList.contains('dark');
  
  const bgColor = isDark ? '#1F2937' : '#ffffff';
  const titleColor = isDark ? '#F9FAFB' : '#111827';
  const contentColor = isDark ? '#D1D5DB' : '#374151';
  const stepCountColor = isDark ? '#9CA3AF' : '#9CA3AF';
  
  return (
    <div {...tooltipProps} style={{ 
      ...tooltipProps.style, 
      maxWidth: 420,
      backgroundColor: bgColor,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }}>
      {step.title && (
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
          color: titleColor,
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {step.title}
        </div>
      )}
      <div style={{
        fontSize: '15px',
        lineHeight: '1.7',
        color: contentColor,
        padding: '8px 0',
        textAlign: isRTL ? 'right' : 'left'
      }}>
        {step.content}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {index > 0 && (
            <button
              {...backProps}
              style={{
                color: '#6B7280',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {t('tourBack')}
            </button>
          )}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: stepCountColor,
          fontWeight: '500',
          margin: '0 12px'
        }}>
          {isRTL ? (
            <span>{size} {t('tourStepOf')} {index + 1} {t('tourStep')}</span>
          ) : (
            <span>{t('tourStep')} {index + 1} {t('tourOf')} {size}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isLastStep && (
            <button
              {...skipProps}
              style={{
                color: '#9CA3AF',
                fontSize: '14px',
                fontWeight: '500',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 16px'
              }}
            >
              {t('tourSkip')}
            </button>
          )}
          <button
            {...primaryProps}
            style={{
              backgroundColor: '#6366F1',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isLastStep ? t('tourFinish') : t('tourNext')}
          </button>
        </div>
      </div>
    </div>
  );
};

const TourGuide = ({ steps, tourKey, autoStart = false, showButton = true, bindStartToWindowKey }) => {
  const { t, i18n } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // Check if user has already seen this tour
    const hasSeenTour = localStorage.getItem(`tour_${tourKey}_completed`);
    
    if (autoStart && !hasSeenTour) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        setRun(true);
      }, 1000);
    }
  }, [autoStart, tourKey]);

  // Optional: expose a start function on window so external buttons
  // on specific pages can trigger this tour without changing existing flows
  useEffect(() => {
    if (!bindStartToWindowKey || typeof window === 'undefined') return;

    const start = () => {
      setStepIndex(0);
      setRun(true);
    };

    window[bindStartToWindowKey] = start;

    return () => {
      if (window[bindStartToWindowKey] === start) {
        delete window[bindStartToWindowKey];
      }
    };
  }, [bindStartToWindowKey]);

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    console.log(`[Tour ${tourKey}] Step ${index + 1}/${steps.length}:`, { type, status, action, target: step?.target });

    if (type === EVENTS.STEP_AFTER) {
      // Only update state when a step is successfully shown
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      console.log(`[Tour ${tourKey}] Moving to step ${nextIndex + 1}`);
      setStepIndex(nextIndex);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Target not found - skip to next step
      console.warn(`[Tour ${tourKey}] Target not found for step ${index + 1}: ${step?.target}`);
      const nextIndex = index + 1;
      if (nextIndex < steps.length) {
        console.log(`[Tour ${tourKey}] Skipping to step ${nextIndex + 1}`);
        setStepIndex(nextIndex);
      } else {
        // No more steps, finish tour
        console.log(`[Tour ${tourKey}] No more steps, finishing tour`);
        setRun(false);
        setStepIndex(0);
        localStorage.setItem(`tour_${tourKey}_completed`, 'true');
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finished or skipped
      console.log(`[Tour ${tourKey}] Tour ${status}`);
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(`tour_${tourKey}_completed`, 'true');
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_${tourKey}_completed`);
    startTour();
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        callback={handleJoyrideCallback}
        tooltipComponent={(props) => <CustomTooltip {...props} t={t} isRTL={isRTL} />}
        styles={{
          options: {
            primaryColor: '#6366F1',
            textColor: '#1F2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            arrowColor: '#ffffff',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '16px',
            padding: '24px',
            fontSize: '15px',
            lineHeight: '1.6',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            direction: isRTL ? 'rtl' : 'ltr',
          },
          tooltipContainer: {
            textAlign: isRTL ? 'right' : 'left',
          },
          tooltipTitle: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#111827',
          },
          tooltipContent: {
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#374151',
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: '#6366F1',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
          },
          buttonBack: {
            color: '#6B7280',
            marginRight: '12px',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
          buttonSkip: {
            color: '#9CA3AF',
            fontSize: '14px',
            fontWeight: '500',
          },
          beacon: {
            offsetX: 0,
            offsetY: 0,
          },
          beaconInner: {
            backgroundColor: '#6366F1',
          },
          beaconOuter: {
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            border: '2px solid #6366F1',
          },
        }}
        locale={{
          back: t('tourBack'),
          close: t('tourClose'),
          last: t('tourFinish'),
          next: t('tourNext'),
          skip: t('tourSkip'),
        }}
      />

      {showButton && (
        <button
          onClick={startTour}
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105`}
          title={t('takeATour')}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">{t('takeATour')}</span>
        </button>
      )}
    </>
  );
};

export default TourGuide;
