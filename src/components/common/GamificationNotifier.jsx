import React, { useEffect, useState, useCallback } from 'react';
import CelebrationModal from './CelebrationModal';

// Global singleton state for queue management
let globalQueue = [];
let globalCurrent = null;
let globalSetQueue = null;
let globalSetCurrent = null;
let activeComponentId = null;

const GamificationNotifier = () => {
  const [queue, setQueue] = useState(globalQueue);
  const [current, setCurrent] = useState(globalCurrent);
  const [componentId] = useState(() => Math.random().toString(36).substr(2, 9));

  // Track component mounting for debugging
  useEffect(() => {
    console.log('🎯 GamificationNotifier: Component MOUNTED', componentId);
    
    // Only allow one component to be active
    if (!activeComponentId) {
      activeComponentId = componentId;
      globalSetQueue = setQueue;
      globalSetCurrent = setCurrent;
      console.log('🎯 GamificationNotifier: This component is now ACTIVE', componentId);
    } else {
      console.log('🎯 GamificationNotifier: Another component is active, this one will be passive', componentId);
    }
    
    return () => {
      console.log('🎯 GamificationNotifier: Component UNMOUNTED', componentId);
      if (activeComponentId === componentId) {
        activeComponentId = null;
        globalSetQueue = null;
        globalSetCurrent = null;
        console.log('🎯 GamificationNotifier: Active component unmounted', componentId);
      }
    };
  }, [componentId]);

  const onClose = useCallback(() => {
    // Only the active component should handle closing
    if (activeComponentId !== componentId) {
      console.log('🎯 GamificationNotifier: Passive component ignoring close', componentId);
      return;
    }
    
    console.log('🎯 GamificationNotifier: Active component closing animation', componentId, {
      currentGlobalCurrent: globalCurrent,
      queueLength: globalQueue.length
    });
    
    // CRITICAL: Clear current AND remove from queue IMMEDIATELY to prevent race conditions
    globalCurrent = null;
    
    // Remove the current item from global queue immediately
    const [, ...rest] = globalQueue;
    globalQueue = rest;
    
    // Update state after a tiny delay to allow modal to start closing animation
    setTimeout(() => {
      if (globalSetCurrent) {
        globalSetCurrent(null);
      }
      if (globalSetQueue) {
        globalSetQueue([...globalQueue]);
      }
      console.log('🎯 GamificationNotifier: State updated after close', {
        newQueueLength: globalQueue.length,
        globalCurrentIsNull: globalCurrent === null
      });
    }, 100);
  }, [componentId]);

  useEffect(() => {
    console.log('🎯 GamificationNotifier: Queue processing effect triggered', {
      componentId,
      isActive: activeComponentId === componentId,
      hasGlobalCurrent: !!globalCurrent,
      queueLength: globalQueue.length
    });
    
    // Only the active component should process the queue
    if (activeComponentId !== componentId) {
      console.log('🎯 GamificationNotifier: Not active component, skipping', componentId);
      return;
    }
    
    // CRITICAL: Check globalCurrent first to prevent double processing
    if (globalCurrent) {
      console.log('🎯 GamificationNotifier: Animation already active, skipping', componentId);
      return;
    }
    
    if (globalQueue.length > 0) {
      console.log('🎯 GamificationNotifier: Processing next animation from queue', componentId, globalQueue[0]);
      globalCurrent = globalQueue[0];
      if (globalSetCurrent) globalSetCurrent(globalQueue[0]);
    } else {
      console.log('🎯 GamificationNotifier: Queue is empty, nothing to process', componentId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, componentId]);

  useEffect(() => {
    // Use a singleton pattern to prevent multiple event listeners
    const LISTENER_KEY = 'gamificationNotifierActive';
    
    // Check if another instance is already handling events
    if (window[LISTENER_KEY]) {
      console.log('🎯 GamificationNotifier: Another instance is already active, skipping listener setup');
      return;
    }
    
    // Mark this instance as the active listener
    window[LISTENER_KEY] = true;
    
    const recent = new Map();
    const handler = (e) => {
      const detail = e.detail || {};
      const key = `${detail.eventType || 'signup'}:${detail.message || ''}`;
      const now = Date.now();
      const last = recent.get(key) || 0;
      
      // Add comprehensive logging
      console.log('🎯 GamificationNotifier: Event received', {
        eventType: detail.eventType,
        message: detail.message,
        key,
        timeSinceLastSame: now - last,
        willShow: now - last >= 2000,
        currentQueue: queue.length,
        currentActive: !!current
      });
      
      if (now - last < 2000) {
        console.log('🚫 GamificationNotifier: BLOCKED duplicate event', key);
        return; // drop duplicates within 2s
      }
      
      recent.set(key, now);
      const item = {
        eventType: detail.eventType || 'signup',
        message: detail.message || '',
        userName: detail.userName || null,
        courseName: detail.courseName || null,
      };
      
      console.log('✅ GamificationNotifier: Adding to global queue', item);
      
      // Update global queue
      globalQueue = [...globalQueue, item];
      if (globalSetQueue) globalSetQueue([...globalQueue]);
    };

    console.log('🎯 GamificationNotifier: Event listener attached (active instance)');
    window.addEventListener('gamification:notify', handler);
    
    return () => {
      console.log('🎯 GamificationNotifier: Event listener removed (active instance)');
      window.removeEventListener('gamification:notify', handler);
      // Only clear the flag if this instance was the active one
      if (window[LISTENER_KEY]) {
        delete window[LISTENER_KEY];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the active component should render the modal
  if (activeComponentId !== componentId) {
    console.log('🎯 GamificationNotifier: Passive component not rendering modal', componentId);
    return null;
  }

  return (
    <CelebrationModal 
      isOpen={!!current}
      onClose={onClose}
      eventType={current?.eventType}
      message={current?.message}
      userName={current?.userName}
      courseName={current?.courseName}
      userRole={current?.userRole || 'student'}
      autoCloseDelay={4500}
    />
  );
};

export default GamificationNotifier;
