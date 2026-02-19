/**
 * Utility functions for gamification system
 */

/**
 * Fire gamification events with deduplication to prevent spam
 * @param {Object} gamificationData - The gamification data from server response
 */
export const fireGamificationEvents = (gamificationData) => {
  console.log('🚀 fireGamificationEvents: Called with data', gamificationData);
  if (!gamificationData) {
    console.log('🚫 fireGamificationEvents: No data provided');
    return;
  }

  const recentEvents = JSON.parse(sessionStorage.getItem('recentGamificationEvents') || '{}');
  const now = Date.now();
  
  const fireToast = (detail) => {
    const key = `${detail.eventType}:${detail.message}`;
    const lastTime = recentEvents[key] || 0;

    // For simple pointsAwarded events (e.g. finishing videos), we only
    // guard against very fast duplicates, not whole-session suppression.
    // Other achievement types (badges, titles, etc.) keep the stricter
    // session-based deduplication to avoid spam.
    let alreadyShownInSession = false;
    let sessionKey = null;

    if (detail.eventType !== 'pointsAwarded') {
      sessionKey = `activity_shown_${key}`;
      alreadyShownInSession = !!sessionStorage.getItem(sessionKey);
    }

    console.log('🎮 fireGamificationEvents: Attempting to fire TOAST event', {
      eventType: detail.eventType,
      message: detail.message,
      key,
      timeSinceLastSame: now - lastTime,
      alreadyShownInSession,
      willFire: now - lastTime > 5000 && !alreadyShownInSession
    });

    // Prevent duplicate events within 5 seconds OR (for non-points events)
    // if already shown in this session.
    if (now - lastTime > 5000 && !alreadyShownInSession) {
      console.log('✅ fireGamificationEvents: Dispatching TOAST event', detail);
      window.dispatchEvent(new CustomEvent('show-gamification-toast', { detail }));
      recentEvents[key] = now;

      // Only set a longer-lived session flag for non-points events
      if (sessionKey) {
        sessionStorage.setItem(sessionKey, 'true');

        // Auto-clear session flag after 2 minutes to allow re-showing for new achievements
        setTimeout(() => {
          sessionStorage.removeItem(sessionKey);
          console.log('🎮 fireGamificationEvents: Cleared session flag', sessionKey);
        }, 120000);
      }

      // Clean old events (older than 1 minute)
      Object.keys(recentEvents).forEach(k => {
        if (now - recentEvents[k] > 60000) delete recentEvents[k];
      });

      try {
        sessionStorage.setItem('recentGamificationEvents', JSON.stringify(recentEvents));
      } catch (e) {
        // Handle storage quota exceeded
        sessionStorage.removeItem('recentGamificationEvents');
      }
    } else {
      console.log('🚫 fireGamificationEvents: BLOCKED duplicate TOAST event', key, {
        timeSinceLastSame: now - lastTime,
        alreadyShownInSession
      });
    }
  };
  
  const fireModal = (detail) => {
    const key = detail.eventType === 'courseCompleted' ? 'courseCompleted' : `${detail.eventType}:${detail.message}`;
    const lastTime = recentEvents[key] || 0;
    
    console.log('🎮 fireGamificationEvents: Attempting to fire MODAL event', {
      eventType: detail.eventType,
      message: detail.message,
      key,
      timeSinceLastSame: now - lastTime,
      willFire: now - lastTime > 10000
    });
    
    // Course completion modals have longer deduplication (10 seconds)
    if (now - lastTime > 10000) {
      console.log('✅ fireGamificationEvents: Dispatching MODAL event', detail);
      window.dispatchEvent(new CustomEvent('gamification:notify', { detail }));
      recentEvents[key] = now;
      
      // Clean old events (older than 1 minute)
      Object.keys(recentEvents).forEach(k => {
        if (now - recentEvents[k] > 60000) delete recentEvents[k];
      });
      
      try {
        sessionStorage.setItem('recentGamificationEvents', JSON.stringify(recentEvents));
      } catch (e) {
        // Handle storage quota exceeded
        sessionStorage.removeItem('recentGamificationEvents');
      }
    } else {
      console.log('🚫 fireGamificationEvents: BLOCKED duplicate MODAL event', key);
    }
  };

  const gam = gamificationData;
  console.log('🎮 fireGamificationEvents: Processing gamification data structure:', {
    hasPointsAwarded: !!gam.pointsAwarded,
    hasAwardedBadges: Array.isArray(gam.awardedBadges),
    hasAssignedTitle: !!gam.assignedTitle?.name,
    hasCourseAward: !!gam.courseAward,
    hasStreakMessage: !!gam.streakMessage,
    rawData: gam
  });
  
  // Fire basic achievement events using TOAST notifications (individual activities)
  if (gam.pointsAwarded && gam.pointsAwarded > 0) {
    console.log('🎮 fireGamificationEvents: Firing points awarded TOAST event');
    fireToast({ eventType: 'pointsAwarded', message: `+${gam.pointsAwarded} points earned!` });
  }
  
  if (Array.isArray(gam.awardedBadges) && gam.awardedBadges.length > 0) {
    console.log('🎮 fireGamificationEvents: Firing badge TOAST events:', gam.awardedBadges.length);
    gam.awardedBadges.forEach((b) => {
      fireToast({ eventType: 'badgeUnlocked', message: `${b.icon || '🏅'} ${b.title} unlocked! (+${b.pointsReward || 0} points)` });
    });
  }
  
  if (gam.assignedTitle?.name) {
    console.log('🎮 fireGamificationEvents: Firing title TOAST event:', gam.assignedTitle.name);
    fireToast({ eventType: 'titleUp', message: `${gam.assignedTitle.icon || '👑'} New title: ${gam.assignedTitle.name}` });
  }
  
  // Fire course completion events using a SINGLE MODAL notification
  if (gam.courseAward) {
    const coursePoints = Number(gam.courseAward.pointsAwarded || 0);
    const courseBadges = Array.isArray(gam.courseAward.awardedBadges) ? gam.courseAward.awardedBadges : [];
    const courseTitleName = gam.courseAward.assignedTitle?.name || null;

    const parts = [];
    if (coursePoints > 0) parts.push(`+${coursePoints} bonus points earned!`);
    if (courseBadges.length > 0) parts.push(`Unlocked ${courseBadges.length} badge${courseBadges.length === 1 ? '' : 's'}!`);
    if (courseTitleName) parts.push(`New title: ${courseTitleName}`);

    const suffix = parts.length ? ` ${parts.join(' ')}` : '';
    const message = `Course completed!${suffix}`;

    console.log('🎮 fireGamificationEvents: Firing course completion MODAL event');
    fireModal({ eventType: 'courseCompleted', message });
  }

  // Fire streak events if provided (not from login) using TOAST
  if (gam.streakMessage) {
    console.log('🎮 fireGamificationEvents: Firing streak TOAST event');
    fireToast({ eventType: 'streak', message: gam.streakMessage });
  }
  
  console.log('🎮 fireGamificationEvents: Finished processing all events');
};

/**
 * Fire streak-specific gamification events with deduplication
 * @param {Object} streakData - The streak data from server response
 */
export const fireStreakEvents = (streakData) => {
  console.log('🔥 fireStreakEvents: Called with data', streakData);
  if (!streakData) {
    console.log('🚫 fireStreakEvents: No data provided');
    return;
  }

  const recentEvents = JSON.parse(sessionStorage.getItem('recentGamificationEvents') || '{}');
  const now = Date.now();
  
  const fire = (detail) => {
    const isLoginSpecific = streakData._loginSpecific;
    
    // Create more robust deduplication key
    let key;
    if (isLoginSpecific) {
      // For login-specific events, use the exact session key provided
      key = `${isLoginSpecific}_${detail.eventType}`;
    } else {
      key = `${detail.eventType}:${detail.message}`;
    }
    
    const lastTime = recentEvents[key] || 0;
    
    // For login-specific streak events, check if already shown in this session
    // For regular events, use 10-second deduplication
    let shouldShow;
    if (isLoginSpecific) {
      // Use a very strict session-based check for login streaks
      const sessionStreakKey = `login_streak_${isLoginSpecific}`;
      const alreadyShownInSession = sessionStorage.getItem(sessionStreakKey);
      
      shouldShow = !alreadyShownInSession;
      
      if (shouldShow) {
        console.log('🔥 fireStreakEvents: Setting session flag to prevent duplicates', sessionStreakKey);
        sessionStorage.setItem(sessionStreakKey, 'true');
        
        // Clear this specific session flag after login flow is complete (30 seconds)
        setTimeout(() => {
          sessionStorage.removeItem(sessionStreakKey);
          console.log('🔥 fireStreakEvents: Cleared session flag', sessionStreakKey);
        }, 30000);
      } else {
        console.log('🔥 fireStreakEvents: Already shown in this session', sessionStreakKey);
      }
    } else {
      shouldShow = now - lastTime > 10000;
    }
    
    console.log('🔥 fireStreakEvents: Attempting to fire event', {
      eventType: detail.eventType,
      message: detail.message,
      key,
      isLoginSpecific: !!isLoginSpecific,
      timeSinceLastSame: now - lastTime,
      shouldShow,
      sessionCheck: isLoginSpecific ? 'checked session storage' : 'time-based'
    });
    
    if (shouldShow) {
      console.log('✅ fireStreakEvents: Dispatching event', detail);
      window.dispatchEvent(new CustomEvent('gamification:notify', { detail }));
      
      // Update recent events to prevent future duplicates
      recentEvents[key] = now;
      
      // Clean old events (older than 1 minute)
      Object.keys(recentEvents).forEach(k => {
        if (now - recentEvents[k] > 60000) delete recentEvents[k];
      });
      
      try {
        sessionStorage.setItem('recentGamificationEvents', JSON.stringify(recentEvents));
      } catch (e) {
        // Handle storage quota exceeded
        sessionStorage.removeItem('recentGamificationEvents');
      }
    } else {
      console.log('🚫 fireStreakEvents: BLOCKED duplicate event', key);
    }
  };
  
  // Show streak notification
  if (streakData.streakMessage) {
    fire({ eventType: 'streak', message: streakData.streakMessage });
  }
  
  // Show badge notifications
  if (Array.isArray(streakData.awardedBadges)) {
    streakData.awardedBadges.forEach((b) => 
      fire({ eventType: 'badgeUnlocked', message: `${b.icon || '🏅'} ${b.title} (+${b.pointsReward || 0})` })
    );
  }
  
  // Show title notification
  if (streakData.assignedTitle?.name) {
    fire({ eventType: 'titleUp', message: `${streakData.assignedTitle.icon || '👑'} ${streakData.assignedTitle.name}` });
  }
};

/**
 * Utility function to clear all animation deduplication flags
 * Useful for testing or debugging
 * Call this from browser console: window.clearGamificationFlags()
 */
export const clearAllGamificationFlags = () => {
  console.log('🧹 Clearing all gamification animation flags...');
  
  // Get all session storage keys
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith('login_streak_') || 
      key.startsWith('streak_') || 
      key.startsWith('activity_shown_') ||
      key.startsWith('recentGamificationEvents')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all gamification-related keys
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('🧹 Removed:', key);
  });
  
  console.log(`🧹 Cleared ${keysToRemove.length} gamification flags`);
  return keysToRemove.length;
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.clearGamificationFlags = clearAllGamificationFlags;
}
