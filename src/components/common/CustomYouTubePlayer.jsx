import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Gauge, SkipForward, SkipBack, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

let ytIframeApiPromise;
let ytIframeApiPromiseStartedAt = 0;
let ytIframeApiPromiseState = 'idle';

let currentVideoId = null;
let pendingVideoId = null;
let hasUserStartedPlayback = false;
let introCompleted = false;
let seekingEnabled = false;

const INTRO_DURATION = 10000;
const MAX_SPLASH_MS = 12000;
const PRELOAD_SECONDS = 15; // adjustable (e.g. 20) // PRELOAD duration is enforced via PRELOAD_GATE_MS below (required)
const PRELOAD_GATE_MS = PRELOAD_SECONDS * 1000;
const PRELOAD_BUFFER_SECONDS_EARLY_EXIT = 30; // CHANGE: allow early exit if enough buffer seconds are confirmed via getVideoLoadedFraction() * duration
const resetYouTubeIframeAPI = () => {
  ytIframeApiPromise = null;
  ytIframeApiPromiseStartedAt = 0;
  ytIframeApiPromiseState = 'idle';
  try {
    document.querySelectorAll('script[data-yt-iframe-api]').forEach((el) => el.remove());
  } catch (_) {}
};
const loadYouTubeIframeAPI = () => {
  if (window.YT && window.YT.Player) {
    ytIframeApiPromiseState = 'fulfilled';
    return Promise.resolve(window.YT);
  }

  // Allow explicit retries after a failure.
  if (ytIframeApiPromise && ytIframeApiPromiseState === 'rejected') {
    resetYouTubeIframeAPI();
  }

  // If a previous promise got stuck pending (common during HMR / partial reloads), reset it.
  if (
    ytIframeApiPromise &&
    ytIframeApiPromiseState === 'pending' &&
    ytIframeApiPromiseStartedAt &&
    Date.now() - ytIframeApiPromiseStartedAt > 12000
  ) {
    ytIframeApiPromise = null;
    ytIframeApiPromiseState = 'idle';
    ytIframeApiPromiseStartedAt = 0;
  }

  if (ytIframeApiPromise) return ytIframeApiPromise;

  ytIframeApiPromise = new Promise((resolve, reject) => {
    try {
      ytIframeApiPromiseState = 'pending';
      ytIframeApiPromiseStartedAt = Date.now();

      let settled = false;
      const settleResolve = () => {
        if (settled) return;
        if (window.YT && window.YT.Player) {
          settled = true;
          ytIframeApiPromiseState = 'fulfilled';
          resolve(window.YT);
        }
      };
      const settleReject = (err) => {
        if (settled) return;
        settled = true;
        ytIframeApiPromiseState = 'rejected';
        reject(err);
      };

      const existing = document.querySelector('script[data-yt-iframe-api]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.dataset.ytIframeApi = 'true';
        tag.onerror = () => settleReject(new Error('Failed to load video player'));
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          if (typeof prev === 'function') prev();
        } finally {
          settleResolve();
        }
      };

      // Fallback: if the API is already loaded (or onYouTubeIframeAPIReady already fired), poll for YT.Player.
      const start = Date.now();
      const poll = setInterval(() => {
        if (settled) {
          clearInterval(poll);
          return;
        }
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          settleResolve();
          return;
        }
        if (Date.now() - start > 20000) {
          clearInterval(poll);
          settleReject(new Error('Timed out loading video player'));
        }
      }, 50);
    } catch (e) {
      ytIframeApiPromiseState = 'rejected';
      reject(e);
    }
  });

  return ytIframeApiPromise;
};

/**
 * Custom YouTube Player with EduFlow Branding
 * Hides all YouTube controls and branding, replaces with custom UI
 * Uses YouTube IFrame API for control
 */
const CustomYouTubePlayer = ({ 
  youtubeVideoId, 
  embedUrl,
  title, 
  startupSplashMs = 10000,
  contentId, 
  onComplete 
}) => {
  const { t, i18n } = useTranslation();

  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualityPreference, setQualityPreference] = useState('auto');
  const [availableQualityLevels, setAvailableQualityLevels] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ended, setEnded] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [startupCrop, setStartupCrop] = useState(false);
  const [initNonce, setInitNonce] = useState(0);
  const [playbackInitiated, setPlaybackInitiated] = useState(false);
  const [splashHardTimedOut, setSplashHardTimedOut] = useState(false);
  const [overlayPermanentlyHidden, setOverlayPermanentlyHidden] = useState(false);
  const [switchingVideo, setSwitchingVideo] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false); // CHANGE: explicit metadata-loaded flag to keep existing loading UI visible until duration is known (esp. on video switch)
  const [isPreloading, setIsPreloading] = useState(false); // CHANGE: hard preload/buffer gate; blocks overlay play + intro until satisfied
  const [introComplete, setIntroComplete] = useState(false); // CHANGE: explicit intro completion flag (drives canSeek)
  const [canSeek, setCanSeek] = useState(false); // CHANGE: reactive seek enablement (PLAYING + introComplete)
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [actualPlaybackQuality, setActualPlaybackQuality] = useState('');
  const [qualitySwitching, setQualitySwitching] = useState(false);
  
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const playOverlayRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const completedRef = useRef(false);
  const playerReadyRef = useRef(false);
  const pendingVideoIdRef = useRef(youtubeVideoId || null);
  const pendingShouldPlayRef = useRef(false);
  const loadedVideoIdRef = useRef(null);
  const durationRef = useRef(0);
  const readyTimeoutRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const bufferingRef = useRef(false);
  const playingRef = useRef(false);
  const autoplayFallbackRef = useRef(null);
  const lastPlayerStateRef = useRef(null);
  const endedRef = useRef(false);
  const controlsHideTimeoutRef = useRef(null);
  const startupCropTimeoutRef = useRef(null);
  const startupCropHardTimeoutRef = useRef(null);
  const startupCropUsedRef = useRef(false);
  const startupCropActiveRef = useRef(false);
  const splashCountdownStartedRef = useRef(false);
  const splashRestoreRef = useRef(null);
  const splashAfterRef = useRef(null);
  const splashMinElapsedRef = useRef(false);
  const splashStartPlaybackRef = useRef(true);
  const playbackInitiatedRef = useRef(false);
  const mutedRef = useRef(false);
  const volumeRef = useRef(80);
  const qualityPreferenceRef = useRef('auto');
  const lastReportedQualityRef = useRef(null); // CHANGE: prevents state churn while syncing actual applied quality
  const qualitySwitchingRef = useRef(false);
  const qualitySwitchTargetRef = useRef(null);
  const qualitySwitchTimeoutRef = useRef(null);
  const qualitySwitchWasPlayingRef = useRef(false);
  const switchingVideoRef = useRef(false);
  const lastPlayedVideoIdRef = useRef(null);
  const resolvedVideoIdRef = useRef(null);

  const metadataReadyRef = useRef(false); // CHANGE: used by preload gate without stale closures
  const isPreloadingRef = useRef(false); // CHANGE: used by preload gate + guards without stale closures
  const preloadGateStartedAtRef = useRef(0); // CHANGE: per-video preload start timestamp
  const preloadGateIntervalRef = useRef(null); // CHANGE: polling loop for preload gate
  const preloadGateTokenRef = useRef(0); // CHANGE: prevents race conditions when switching videos mid-preload
  const introCompleteRef = useRef(false); // CHANGE: drives canSeek during PLAYING
  const canSeekRef = useRef(false); // CHANGE: seek handlers read this to ensure real seekTo only when allowed
  const scrubTimeRef = useRef(0);
  const isScrubbingRef = useRef(false);
  const lastSeekInteractionAtRef = useRef(0);
  const actualPlaybackQualityRef = useRef('');
  const qualityApplyTimeoutRef = useRef(null);
  const qualityApplyAttemptRef = useRef(0);

  const resolvedVideoId = useMemo(() => {
    if (youtubeVideoId) return youtubeVideoId;
    if (!embedUrl) return null;

    try {
      const url = new URL(embedUrl, window.location.origin);
      const v = url.searchParams.get('v');
      if (v) return v;

      const path = url.pathname || '';
      const embedMatch = path.match(/\/embed\/([^/?#]+)/i);
      if (embedMatch && embedMatch[1]) return embedMatch[1];
      const shortMatch = path.match(/^\/([^/?#]+)$/);
      if (url.hostname.includes('youtu.be') && shortMatch && shortMatch[1]) return shortMatch[1];
    } catch (_) {
      // ignore
    }

    return null;
  }, [embedUrl, youtubeVideoId]);

  useEffect(() => {
    resolvedVideoIdRef.current = resolvedVideoId || null;
  }, [resolvedVideoId]);

  useEffect(() => {
    metadataReadyRef.current = metadataReady;
  }, [metadataReady]);

  useEffect(() => {
    isPreloadingRef.current = isPreloading;
  }, [isPreloading]);

  useEffect(() => {
    introCompleteRef.current = introComplete;
  }, [introComplete]);

  useEffect(() => {
    canSeekRef.current = canSeek;
  }, [canSeek]);

  useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);

  useEffect(() => {
    scrubTimeRef.current = scrubTime;
  }, [scrubTime]);

  useEffect(() => {
    actualPlaybackQualityRef.current = actualPlaybackQuality;
  }, [actualPlaybackQuality]);

  useEffect(() => {
    if (playing) return;
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    setIsScrubbing(false);
  }, [playing]);

  useEffect(() => {
    // CHANGE: SEEKING FIX (required). If intro completion toggles while already PLAYING,
    // enable seeking immediately (no need to wait for another onStateChange).
    const shouldEnable = !!(playing && hasUserStartedPlayback);
    if (shouldEnable && !canSeekRef.current) {
      setCanSeek(true);
      canSeekRef.current = true;
    }
  }, [playing]);

  const playerVars = useMemo(
     () => ({
       autoplay: 0,
       controls: 0,
       modestbranding: 1,
       rel: 0,
       fs: 0,
       iv_load_policy: 3,
       cc_load_policy: 0,
       disablekb: 1,
       playsinline: 1,
       enablejsapi: 1,
       origin: window.location.origin
     }),
     []
   );

  const isRTL = i18n?.language === 'ar';

  const shouldShowIntro = useMemo(() => {
    return true;
  }, []);

  const translatedErrorMessage = useMemo(() => {
    if (!errorMessage) return '';
    if (errorMessage === 'Network error, try again') return t('videoNetworkError');
    if (errorMessage === 'Timed out loading video player') return t('videoApiLoadTimeout');
    if (errorMessage === 'Failed to load video player') return t('videoApiLoadFailed');
    return errorMessage;
  }, [errorMessage, t]);

  useEffect(() => {
    qualityPreferenceRef.current = qualityPreference;
  }, [qualityPreference]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    startupCropActiveRef.current = startupCrop;
  }, [startupCrop]);

  const startupSplashMsRef = useRef(startupSplashMs);
  useEffect(() => {
    startupSplashMsRef.current = INTRO_DURATION;
  }, []);

  const QUALITY_STORAGE_KEY = 'eduflow_youtube_quality';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUALITY_STORAGE_KEY);
      if (saved === 'auto') {
        setQualityPreference('auto');
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(QUALITY_STORAGE_KEY, qualityPreference);
    } catch (_) {}
  }, [qualityPreference]);

  const markPlaybackInitiated = useCallback(() => {
    if (playbackInitiatedRef.current) return;
    playbackInitiatedRef.current = true;
    setPlaybackInitiated(true);
  }, []);

  const permanentlyHideOverlay = useCallback(() => {
    setOverlayPermanentlyHidden(true);
    try {
      const el = playOverlayRef.current;
      if (el) el.style.display = 'none';
    } catch (_) {}
  }, []);

  const resetPlaybackSession = useCallback(() => {
    currentVideoId = null;
    hasUserStartedPlayback = false;
    introCompleted = false;
    seekingEnabled = false;

    qualitySwitchingRef.current = false;
    qualitySwitchTargetRef.current = null;
    qualitySwitchWasPlayingRef.current = false;
    setQualitySwitching(false);
    if (qualitySwitchTimeoutRef.current) {
      clearTimeout(qualitySwitchTimeoutRef.current);
      qualitySwitchTimeoutRef.current = null;
    }

    setOverlayPermanentlyHidden(false);
    try {
      const el = playOverlayRef.current;
      if (el) el.style.display = '';
    } catch (_) {}

    setPlaying(false);
    playingRef.current = false;
    setEnded(false);
    endedRef.current = false;
    setShowControlsOverlay(false);

    setStartupCrop(false);
    startupCropUsedRef.current = false;
    startupCropActiveRef.current = false;
    splashCountdownStartedRef.current = false;
    splashRestoreRef.current = null;
    splashAfterRef.current = null;
    setSplashHardTimedOut(false);

    setPlaybackInitiated(false);
    playbackInitiatedRef.current = false;
    splashMinElapsedRef.current = false;

    setMuted(false);
    setVolume(80);
    setCurrentTime(0);
    setDuration(0);
    setMetadataReady(false); // CHANGE: switching/opening a video starts from a clean metadata-loading stage
    setIsPreloading(false); // CHANGE: preload gate is re-started explicitly per selected video
    isPreloadingRef.current = false;
    setIntroComplete(false); // CHANGE: explicit intro completion reset on switch
    introCompleteRef.current = false;
    setCanSeek(false); // CHANGE: seeking is disabled until PLAYING + intro complete
    canSeekRef.current = false;
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    setScrubTime(0);
    scrubTimeRef.current = 0;
    lastSeekInteractionAtRef.current = 0;
    setActualPlaybackQuality('');
    actualPlaybackQualityRef.current = '';
    try {
      setAvailableQualityLevels([]);
    } catch (_) {}
    if (qualityApplyTimeoutRef.current) {
      clearTimeout(qualityApplyTimeoutRef.current);
      qualityApplyTimeoutRef.current = null;
    }
    qualityApplyAttemptRef.current = 0;
    setPlaybackRate(1);
    setQualityPreference('auto');
    qualityPreferenceRef.current = 'auto';
    setShowSpeedMenu(false);
    setShowQualityMenu(false);
    setBuffering(false);
    bufferingRef.current = false;
    setErrorMessage('');

    pendingShouldPlayRef.current = false;
    loadedVideoIdRef.current = null;

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (autoplayFallbackRef.current) {
      clearTimeout(autoplayFallbackRef.current);
      autoplayFallbackRef.current = null;
    }

    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
    if (startupCropTimeoutRef.current) {
      clearTimeout(startupCropTimeoutRef.current);
      startupCropTimeoutRef.current = null;
    }
    if (startupCropHardTimeoutRef.current) {
      clearTimeout(startupCropHardTimeoutRef.current);
      startupCropHardTimeoutRef.current = null;
    }

    // CHANGE: clear preload gate polling on reset/switch (prevents old video state from leaking)
    if (preloadGateIntervalRef.current) {
      clearInterval(preloadGateIntervalRef.current);
      preloadGateIntervalRef.current = null;
    }
  }, []);

  const startPreloadGate = useCallback((videoId) => {
    // CHANGE: required 30s preload/buffer gate. This blocks overlay play + intro until:
    // - player is READY
    // - AND (30s elapsed OR getVideoLoadedFraction() indicates sufficient buffer)
    preloadGateTokenRef.current += 1;
    const token = preloadGateTokenRef.current;

    if (preloadGateIntervalRef.current) {
      clearInterval(preloadGateIntervalRef.current);
      preloadGateIntervalRef.current = null;
    }

    if (!videoId) {
      setIsPreloading(false);
      isPreloadingRef.current = false;
      preloadGateStartedAtRef.current = 0;
      return;
    }

    preloadGateStartedAtRef.current = Date.now();
    setIsPreloading(true);
    isPreloadingRef.current = true;

    preloadGateIntervalRef.current = setInterval(() => {
      // Race guard: if a new video was selected, stop this gate.
      if (preloadGateTokenRef.current !== token) {
        try {
          clearInterval(preloadGateIntervalRef.current);
        } catch (_) {}
        preloadGateIntervalRef.current = null;
        return;
      }

      // Must be READY before we ever allow overlay play.
      if (!playerReadyRef.current) return;
      if (!metadataReadyRef.current) return;

      const elapsed = Date.now() - (preloadGateStartedAtRef.current || Date.now());

      let loadedFraction = 0;
      try {
        const p = playerRef.current;
        if (p && p.getVideoLoadedFraction) {
          const f = p.getVideoLoadedFraction();
          if (typeof f === 'number' && !Number.isNaN(f)) loadedFraction = f;
        }
      } catch (_) {}

      let bufferedSeconds = 0;
      try {
        const d = durationRef.current || 0;
        if (d > 0 && loadedFraction > 0) bufferedSeconds = loadedFraction * d;
      } catch (_) {}

      const bufferOk = bufferedSeconds >= PRELOAD_BUFFER_SECONDS_EARLY_EXIT;
      const timeOk = elapsed >= PRELOAD_GATE_MS;

      if (!bufferOk && !timeOk) return;

      // Exit: allow overlay play button + intro.
      setIsPreloading(false);
      isPreloadingRef.current = false;
      try {
        clearInterval(preloadGateIntervalRef.current);
      } catch (_) {}
      preloadGateIntervalRef.current = null;
    }, 250);
  }, []);

  const preloadVideo = useCallback((videoId) => {
    const p = playerRef.current;
    if (!videoId) return;
    if (!p || !playerReadyRef.current) return;

    try {
      if (p.pauseVideo) p.pauseVideo();
    } catch (_) {}
    try {
      if (p.seekTo) p.seekTo(0, true);
    } catch (_) {}
    try {
      if (p.cueVideoById) p.cueVideoById(videoId);
    } catch (_) {}
    loadedVideoIdRef.current = videoId;
  }, []);

  const onLectureSelect = useCallback(
    (videoId) => {
      // CHANGE: mark a deterministic "switching/loading" stage so the existing loading UI shows until the new video's metadata is loaded.
      // We do NOT re-initialize the player; this only affects UI gating and prevents stale iframe visuals.
      setSwitchingVideo(!!videoId);
      switchingVideoRef.current = !!videoId;
      pendingVideoId = videoId || null;
      pendingVideoIdRef.current = videoId || null;
      resetPlaybackSession();
      startPreloadGate(videoId || null); // CHANGE: required 30s preload/buffer gate is reset on every video select
      preloadVideo(videoId);
    },
    [preloadVideo, resetPlaybackSession, startPreloadGate]
  );

  const finishStartupSplash = useCallback((startPlayback = true) => {
    if (!startupCropActiveRef.current) return;

    if (startupCropTimeoutRef.current) {
      clearTimeout(startupCropTimeoutRef.current);
      startupCropTimeoutRef.current = null;
    }
    if (startupCropHardTimeoutRef.current) {
      clearTimeout(startupCropHardTimeoutRef.current);
      startupCropHardTimeoutRef.current = null;
    }

    startupCropActiveRef.current = false;

    setStartupCrop(false);
    splashCountdownStartedRef.current = false;
    splashMinElapsedRef.current = false;

    const restore = splashRestoreRef.current;
    splashRestoreRef.current = null;

    const after = splashAfterRef.current;
    splashAfterRef.current = null;

    introCompleted = true;
    seekingEnabled = true;
    // CHANGE: explicit intro completion state used to enable seeking ONLY when PLAYING.
    setIntroComplete(true);
    introCompleteRef.current = true;
    currentVideoId = pendingVideoIdRef.current || pendingVideoId || resolvedVideoIdRef.current || null;

    const p = playerRef.current;
    if (p && playerReadyRef.current) {
      try {
        if (p.seekTo) p.seekTo(0, true);
      } catch (_) {}
      if (restore) {
        try {
          if (typeof restore.volume === 'number' && p.setVolume) p.setVolume(restore.volume);
        } catch (_) {}
        try {
          if (restore.muted) {
            if (p.mute) p.mute();
          } else {
            if (p.unMute) p.unMute();
          }
        } catch (_) {}
      }

      if (startPlayback) {
        try {
          if (p.playVideo) p.playVideo();
        } catch (_) {}
      }
    } else {
      pendingShouldPlayRef.current = true;
    }

    if (restore) {
      setMuted(!!restore.muted);
      if (typeof restore.volume === 'number') setVolume(restore.volume);
    }

    try {
      if (after) after();
    } catch (_) {}
  }, []);

  const startStartupSplash = useCallback((afterSplash, options) => {
    const splashMs = Number(startupSplashMsRef.current) || 0;
    const force = !!options?.force;
    const startPlaybackAfterSplash = options?.startPlaybackAfterSplash !== false;

    if (startupCropActiveRef.current) return;

    splashStartPlaybackRef.current = startPlaybackAfterSplash;

    if (splashMs <= 0) {
      startupCropUsedRef.current = true;
      setSplashHardTimedOut(false);
      markPlaybackInitiated();
      const p = playerRef.current;
      if (startPlaybackAfterSplash) {
        if (p && playerReadyRef.current) {
          try {
            if (p.playVideo) p.playVideo();
          } catch (_) {}
        } else {
          pendingShouldPlayRef.current = true;
        }
      }
      try {
        if (afterSplash) afterSplash();
      } catch (_) {}
      return;
    }

    if (!force && startupCropUsedRef.current) {
      startupCropUsedRef.current = true;
      setSplashHardTimedOut(false);
      markPlaybackInitiated();
      const p = playerRef.current;
      if (p && playerReadyRef.current) {
        try {
          if (p.playVideo) p.playVideo();
        } catch (_) {}
      } else {
        pendingShouldPlayRef.current = true;
      }
      try {
        if (afterSplash) afterSplash();
      } catch (_) {}
      return;
    }

    setSplashHardTimedOut(false);
    markPlaybackInitiated();
    splashAfterRef.current = afterSplash || null;
    splashCountdownStartedRef.current = false;
    splashMinElapsedRef.current = false;

    if (startupCropTimeoutRef.current) {
      clearTimeout(startupCropTimeoutRef.current);
      startupCropTimeoutRef.current = null;
    }

    if (startupCropHardTimeoutRef.current) {
      clearTimeout(startupCropHardTimeoutRef.current);
      startupCropHardTimeoutRef.current = null;
    }

    const p = playerRef.current;
    if (!splashRestoreRef.current) {
      let prevMuted = mutedRef.current;
      let prevVolume = volumeRef.current;

      try {
        if (p && p.isMuted) prevMuted = !!p.isMuted();
      } catch (_) {}
      try {
        if (p && p.getVolume) {
          const v = p.getVolume();
          if (typeof v === 'number') prevVolume = v;
        }
      } catch (_) {}

      splashRestoreRef.current = { muted: prevMuted, volume: prevVolume };
    }

    startupCropUsedRef.current = true;
    startupCropActiveRef.current = true;
    setStartupCrop(true);

    if (p && playerReadyRef.current) {
      try {
        if (p.pauseVideo) p.pauseVideo();
      } catch (_) {}
      try {
        if (p.seekTo) p.seekTo(0, true);
      } catch (_) {}
      try {
        if (p.mute) p.mute();
      } catch (_) {}
    }

    startupCropTimeoutRef.current = setTimeout(() => {
      splashMinElapsedRef.current = true;
      if (startupCropActiveRef.current && (playerReadyRef.current || playingRef.current)) {
        setSplashHardTimedOut(false);
        finishStartupSplash(splashStartPlaybackRef.current);
      }
    }, splashMs);

    startupCropHardTimeoutRef.current = setTimeout(() => {
      if (!startupCropActiveRef.current) return;
      if (playerReadyRef.current || playingRef.current) {
        setSplashHardTimedOut(false);
        finishStartupSplash(splashStartPlaybackRef.current);
        return;
      }
      setSplashHardTimedOut(true);
      finishStartupSplash(false);
    }, MAX_SPLASH_MS);
  }, [finishStartupSplash, markPlaybackInitiated]);

  const setPlayerQualityForPreference = useCallback((pref) => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return null;

    try {
      const orderLowToHigh = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440'];
      const levels = p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : [];
      const raw = Array.isArray(levels) ? levels : [];
      const available = raw.filter((q) => orderLowToHigh.includes(q));

      try {
        setAvailableQualityLevels(available);
      } catch (_) {}

      // CHANGE: QUALITY FIX (required). Only apply quality while PLAYING.

      if (!pref || pref === 'auto') {
        try {
          if (p.setPlaybackQuality) p.setPlaybackQuality('default');
        } catch (_) {}
        try {
          if (p.setPlaybackQualityRange) p.setPlaybackQualityRange('tiny', 'hd1440');
        } catch (_) {}

        // CHANGE: reflect actual applied quality for label.
        try {
          if (p.getPlaybackQuality) {
            const applied = p.getPlaybackQuality();
            if (typeof applied === 'string' && applied && applied !== actualPlaybackQualityRef.current) {
              actualPlaybackQualityRef.current = applied;
              setActualPlaybackQuality(applied);
            }
          }
        } catch (_) {}
        return 'auto';
      }

      let picked = pref;

      if (available.length && !available.includes(pref)) {
        const desiredIdx = orderLowToHigh.indexOf(pref);
        let bestLower = null;
        let bestLowerIdx = -1;
        let bestHigher = null;
        let bestHigherIdx = 999;

        for (const q of available) {
          const idx = orderLowToHigh.indexOf(q);
          if (idx < 0) continue;
          if (desiredIdx >= 0) {
            if (idx <= desiredIdx && idx > bestLowerIdx) {
              bestLower = q;
              bestLowerIdx = idx;
            }
            if (idx >= desiredIdx && idx < bestHigherIdx) {
              bestHigher = q;
              bestHigherIdx = idx;
            }
          }
        }

        picked = bestLower || bestHigher || available[0];
      }

      try {
        if (p.setPlaybackQualityRange) p.setPlaybackQualityRange(picked, picked);
      } catch (_) {}
      try {
        if (p.setPlaybackQuality) p.setPlaybackQuality(picked);
      } catch (_) {}

      // CHANGE: reflect actual applied quality for label.
      try {
        if (p.getPlaybackQuality) {
          const applied = p.getPlaybackQuality();
          if (typeof applied === 'string' && applied && applied !== actualPlaybackQualityRef.current) {
            actualPlaybackQualityRef.current = applied;
            setActualPlaybackQuality(applied);
          }
        }
      } catch (_) {}

      // CHANGE: reflect the *actually applied* quality if the player reports it immediately.
      // This is guarded and does NOT reload or restart playback.
      try {
        if (pref && pref !== 'auto' && p.getPlaybackQuality) {
          const applied = p.getPlaybackQuality();
          if (typeof applied === 'string' && applied && applied !== picked && orderLowToHigh.includes(applied)) {
            if (applied !== actualPlaybackQualityRef.current) {
              actualPlaybackQualityRef.current = applied;
              setActualPlaybackQuality(applied);
            }
          }
        }
      } catch (_) {}
      return picked;
    } catch (_) {
      return null;
    }
  }, []);

  const pickQualityTargetForPreference = useCallback((pref) => {
    if (!pref || pref === 'auto') return 'auto';

    const orderLowToHigh = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440'];

    let raw = [];
    try {
      const p = playerRef.current;
      if (p && p.getAvailableQualityLevels) {
        const lvls = p.getAvailableQualityLevels();
        if (Array.isArray(lvls)) raw = lvls;
      }
    } catch (_) {}

    const list = (Array.isArray(raw) && raw.length)
      ? raw
      : (Array.isArray(availableQualityLevels) ? availableQualityLevels : []);

    const available = list.filter((q) => orderLowToHigh.includes(q));
    if (!available.length) return pref;
    if (available.includes(pref)) return pref;

    const desiredIdx = orderLowToHigh.indexOf(pref);
    if (desiredIdx < 0) return available[0];

    let bestLower = null;
    let bestLowerIdx = -1;
    let bestHigher = null;
    let bestHigherIdx = 999;

    for (const q of available) {
      const idx = orderLowToHigh.indexOf(q);
      if (idx < 0) continue;
      if (idx <= desiredIdx && idx > bestLowerIdx) {
        bestLower = q;
        bestLowerIdx = idx;
      }
      if (idx >= desiredIdx && idx < bestHigherIdx) {
        bestHigher = q;
        bestHigherIdx = idx;
      }
    }

    return bestLower || bestHigher || available[0];
  }, [availableQualityLevels]);

  const applyQualityWithRetry = useCallback((pref) => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;

    if (qualityApplyTimeoutRef.current) {
      clearTimeout(qualityApplyTimeoutRef.current);
      qualityApplyTimeoutRef.current = null;
    }

    qualityApplyAttemptRef.current += 1;
    const attempt = qualityApplyAttemptRef.current;

    let target = pref;

    try {
      const picked = setPlayerQualityForPreference(pref);
      if (typeof picked === 'string' && picked) target = picked;
    } catch (_) {}

    if (!pref || pref === 'auto') {
      qualityApplyAttemptRef.current = 0;
      return;
    }

    let applied = null;
    try {
      applied = p.getPlaybackQuality ? p.getPlaybackQuality() : null;
    } catch (_) {}

    if (applied && applied === target) {
      qualityApplyAttemptRef.current = 0;
      return;
    }

    if (attempt >= 8) {
      qualityApplyAttemptRef.current = 0;
      if (qualitySwitchingRef.current) {
        qualitySwitchingRef.current = false;
        qualitySwitchTargetRef.current = null;
        try {
          setQualitySwitching(false);
        } catch (_) {}
        if (qualitySwitchTimeoutRef.current) {
          clearTimeout(qualitySwitchTimeoutRef.current);
          qualitySwitchTimeoutRef.current = null;
        }
        try {
          if (qualitySwitchWasPlayingRef.current && p.playVideo) {
            qualitySwitchWasPlayingRef.current = false;
            p.playVideo();
          }
        } catch (_) {
          qualitySwitchWasPlayingRef.current = false;
        }
      }
      return;
    }

    const delay = Math.min(2000, 150 + attempt * 200);
    qualityApplyTimeoutRef.current = setTimeout(() => {
      applyQualityWithRetry(qualityPreferenceRef.current);
    }, delay);
  }, [setPlayerQualityForPreference]);

  const applyQualityPreference = useCallback((pref) => {
    if (qualitySwitchingRef.current) return;
    setShowQualityMenu(false);
    setShowSpeedMenu(false);

    // CHANGE: QUALITY FIX (required). Apply via setPlaybackQuality only while PLAYING.

    setQualityPreference(pref);

    if (qualitySwitchTimeoutRef.current) {
      clearTimeout(qualitySwitchTimeoutRef.current);
      qualitySwitchTimeoutRef.current = null;
    }

    let alreadyAtTarget = false;
    let targetPref = pref;
    try {
      const pNow = playerRef.current;
      if (pref && pref !== 'auto' && pNow && playerReadyRef.current) {
        targetPref = pickQualityTargetForPreference(pref);

        try {
          if (pNow.getPlaybackQuality) {
            alreadyAtTarget = pNow.getPlaybackQuality() === targetPref;
          }
        } catch (_) {}
      }
    } catch (_) {}

    if (pref && pref !== 'auto' && !alreadyAtTarget) {
      try {
        const pNow = playerRef.current;
        const PLAYING = window?.YT?.PlayerState?.PLAYING;
        const st = pNow && pNow.getPlayerState ? pNow.getPlayerState() : null;
        const isNowPlaying = (typeof PLAYING === 'number' && st === PLAYING) || !!playingRef.current;
        qualitySwitchWasPlayingRef.current = !!isNowPlaying;
        if (isNowPlaying && pNow && pNow.pauseVideo) {
          pNow.pauseVideo();
        }
      } catch (_) {
        qualitySwitchWasPlayingRef.current = false;
      }
      qualitySwitchingRef.current = true;
      qualitySwitchTargetRef.current = targetPref;
      setQualitySwitching(true);
      qualitySwitchTimeoutRef.current = setTimeout(() => {
        qualitySwitchingRef.current = false;
        qualitySwitchTargetRef.current = null;
        setQualitySwitching(false);
        qualitySwitchTimeoutRef.current = null;
        try {
          const pp = playerRef.current;
          if (qualitySwitchWasPlayingRef.current && pp && playerReadyRef.current && pp.playVideo) {
            qualitySwitchWasPlayingRef.current = false;
            pp.playVideo();
          }
        } catch (_) {
          qualitySwitchWasPlayingRef.current = false;
        }
      }, 6000);
    } else {
      qualitySwitchingRef.current = false;
      qualitySwitchTargetRef.current = null;
      qualitySwitchWasPlayingRef.current = false;
      setQualitySwitching(false);
    }

    applyQualityWithRetry(pref);

    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (switchingVideoRef.current || startupCropActiveRef.current) return;
    try {
      const t = p.getCurrentTime ? p.getCurrentTime() : null;
      if (typeof t === 'number' && p.seekTo) p.seekTo(t, true);
    } catch (_) {}
  }, [applyQualityWithRetry, pickQualityTargetForPreference]);

  const qualityLabel = useCallback((q) => {
    const map = {
      tiny: '144p',
      small: '240p',
      medium: '360p',
      large: '480p',
      hd720: '720p',
      hd1080: '1080p',
      hd1440: '1440p',
      auto: 'Auto'
    };
    return map[q] || q;
  }, []);

  const qualityOptions = useMemo(() => {
    // CHANGE: QUALITY FIX (required). Show only real qualities from getAvailableQualityLevels(), plus Auto.
    const orderHighToLow = ['hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
    const available = Array.isArray(availableQualityLevels) ? availableQualityLevels : [];
    const set = new Set(available);
    const orderedAvailable = orderHighToLow.filter((q) => set.has(q));
    return ['auto', ...orderedAvailable];
  }, [availableQualityLevels]);

  const displayedQualityPreference = useMemo(() => {
    if (!qualityPreference || qualityPreference === 'auto') return 'auto';

    const available = Array.isArray(availableQualityLevels) ? availableQualityLevels : [];
    if (available.length && available.includes(qualityPreference)) return qualityPreference;

    if (actualPlaybackQuality && available.length && available.includes(actualPlaybackQuality)) {
      return actualPlaybackQuality;
    }

    if (available.length) {
      const orderHighToLow = ['hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
      const set = new Set(available);
      const best = orderHighToLow.find((q) => set.has(q));
      if (best) return best;
    }

    return 'auto';
  }, [actualPlaybackQuality, availableQualityLevels, qualityPreference]);

  const isQualitySelectable = useCallback(
    (q) => {
      if (q === 'auto') return true;
      if (!Array.isArray(availableQualityLevels) || availableQualityLevels.length === 0) return true;
      return availableQualityLevels.includes(q);
    },
    [availableQualityLevels]
  );

  const handleRetry = useCallback(() => {
    if (!resolvedVideoId) return;

    setErrorMessage('');
    setBuffering(true);
    bufferingRef.current = true;
    pendingVideoId = resolvedVideoId;
    pendingVideoIdRef.current = resolvedVideoId;
    currentVideoId = null;
    hasUserStartedPlayback = false;
    introCompleted = false;
    seekingEnabled = false;
    setOverlayPermanentlyHidden(false);
    try {
      const el = playOverlayRef.current;
      if (el) el.style.display = '';
    } catch (_) {}
    setSplashHardTimedOut(false);
    setPlaybackInitiated(false);
    playbackInitiatedRef.current = false;
    splashMinElapsedRef.current = false;

    const p = playerRef.current;
    const needsHardReset =
      !p ||
      !playerReadyRef.current ||
      errorMessage === 'Timed out loading video player' ||
      errorMessage === 'Failed to load video player';

    if (!needsHardReset && p) {
      try {
        try {
          if (p.pauseVideo) p.pauseVideo();
        } catch (_) {}
        try {
          if (p.seekTo) p.seekTo(0, true);
        } catch (_) {}
        if (p.cueVideoById) p.cueVideoById(resolvedVideoId);
        loadedVideoIdRef.current = resolvedVideoId;
        try {
          setTimeout(() => {
            setPlayerQualityForPreference(qualityPreferenceRef.current);
          }, 250);
        } catch (_) {}
        try {
          setTimeout(() => {
            const pp = playerRef.current;
            if (!pp || !playerReadyRef.current) return;
            const ct = pp.getCurrentTime ? pp.getCurrentTime() : null;
            if (typeof ct === 'number' && pp.seekTo) pp.seekTo(ct, true);
            setPlayerQualityForPreference(qualityPreferenceRef.current);
          }, 900);
        } catch (_) {}
        return;
      } catch (_) {
        // fall through to hard reset
      }
    }

    try {
      if (p && p.destroy) {
        p.destroy();
      }
    } catch (_) {}

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (autoplayFallbackRef.current) {
      clearTimeout(autoplayFallbackRef.current);
      autoplayFallbackRef.current = null;
    }
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
    if (startupCropTimeoutRef.current) {
      clearTimeout(startupCropTimeoutRef.current);
      startupCropTimeoutRef.current = null;
    }
    if (startupCropHardTimeoutRef.current) {
      clearTimeout(startupCropHardTimeoutRef.current);
      startupCropHardTimeoutRef.current = null;
    }

    setStartupCrop(false);
    startupCropUsedRef.current = false;
    splashCountdownStartedRef.current = false;
    splashRestoreRef.current = null;
    splashAfterRef.current = null;
    setShowQualityMenu(false);

    playerRef.current = null;
    loadedVideoIdRef.current = null;
    setPlaying(false);
    playingRef.current = false;
    setEnded(false);
    endedRef.current = false;
    setShowControlsOverlay(false);
    setPlayerReady(false);
    playerReadyRef.current = false;

    try {
      resetYouTubeIframeAPI();
    } catch (_) {}

    setInitNonce((n) => n + 1);
  }, [errorMessage, resolvedVideoId, setPlayerQualityForPreference]);

  useEffect(() => {
    completedRef.current = false;
    onLectureSelect(resolvedVideoId || null);

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (autoplayFallbackRef.current) {
      clearTimeout(autoplayFallbackRef.current);
      autoplayFallbackRef.current = null;
    }

    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
    if (startupCropTimeoutRef.current) {
      clearTimeout(startupCropTimeoutRef.current);
      startupCropTimeoutRef.current = null;
    }
    if (startupCropHardTimeoutRef.current) {
      clearTimeout(startupCropHardTimeoutRef.current);
      startupCropHardTimeoutRef.current = null;
    }

    // Only mark player as not-ready if we don't have an existing YT.Player yet
    if (!playerRef.current) {
      setPlayerReady(false);
      playerReadyRef.current = false;
    }
  }, [onLectureSelect, resolvedVideoId]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    bufferingRef.current = buffering;
  }, [buffering]);

  useEffect(() => {
    if (!splashHardTimedOut) return;
    if (playerReady || playing) {
      setSplashHardTimedOut(false);
    }
  }, [playing, playerReady, splashHardTimedOut]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    endedRef.current = ended;
  }, [ended]);

  useEffect(() => {
    switchingVideoRef.current = switchingVideo;
  }, [switchingVideo]);

  useEffect(() => {
    if (!iframeRef.current) return;
    const mountEl = iframeRef.current;

    const ensureIframeClass = () => {
      try {
        const iframe = mountEl.querySelector('iframe');
        if (iframe) iframe.classList.add('youtube-iframe');
      } catch (_) {}
    };

    ensureIframeClass();
    const obs = new MutationObserver(() => ensureIframeClass());
    obs.observe(mountEl, { childList: true, subtree: true });

    return () => {
      try {
        obs.disconnect();
      } catch (_) {}
    };
  }, []);

  const revealControls = useCallback(() => {
    if (!playingRef.current) return;
    setShowControlsOverlay(true);
    try {
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
      controlsHideTimeoutRef.current = setTimeout(() => {
        if (playingRef.current) setShowControlsOverlay(false);
      }, 2000);
    } catch (_) {}
  }, []);

  const handleError = useCallback((event) => {
    console.error('Video player error:', event.data);
    const errorMessages = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or private',
      101: 'Video not allowed to be played in embedded players',
      150: 'Video not allowed to be played in embedded players'
    };
    setPlaying(false);
    setBuffering(false);
    setErrorMessage(errorMessages[event.data] || 'Network error, try again');
    if (autoplayFallbackRef.current) {
      clearTimeout(autoplayFallbackRef.current);
      autoplayFallbackRef.current = null;
    }
  }, []);

  const handleVideoEnd = async () => {
    if (contentId && !completedRef.current) {
      completedRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        const axios = (await import('axios')).default;
        
        const watchedRes = await axios.post(
          `/api/content/${contentId}/watched`,
          { watchedDuration: duration, totalDuration: duration },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const completeRes = await axios.post(
          `/api/content/${contentId}/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        try {
          const { fireGamificationEvents } = await import('../../utils/gamificationUtils');
          const { showGamificationToast } = await import('../common/ToastManager');

          const watchedGam = watchedRes?.data?.gamification;
          const completeGam = completeRes?.data?.gamification;

          // Prefer the payload that actually awarded points or badges
          const pickGamification = () => {
            const hasRewards = (g) => g && (
              (g.pointsAwarded && g.pointsAwarded > 0) ||
              (Array.isArray(g.awardedBadges) && g.awardedBadges.length > 0) ||
              !!g.assignedTitle ||
              !!g.courseAward
            );

            if (hasRewards(completeGam)) return completeGam;
            if (hasRewards(watchedGam)) return watchedGam;
            return completeGam || watchedGam || null;
          };

          const gamificationData = pickGamification();

          if (gamificationData) {
            fireGamificationEvents(gamificationData);
          } else {
            // Fallback: always show a simple completion toast
            showGamificationToast('videoCompleted', '🎬 Video completed! Keep learning!');
          }
        } catch (e) {
          console.error('[CustomYouTubePlayer] Error firing gamification events:', e);
        }

        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error marking video as complete:', error);
        completedRef.current = false;
      }
    }
  };

  const handleVideoEndRef = useRef(handleVideoEnd);
  useEffect(() => {
    handleVideoEndRef.current = handleVideoEnd;
  }, [handleVideoEnd]);

  const handlePlayerReady = useCallback((event) => {
    setPlayerReady(true);
    playerReadyRef.current = true;
    setErrorMessage('');
    setBuffering(false);
    bufferingRef.current = false;
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    try {
      const d = event.target.getDuration();
      setDuration(d);
      // CHANGE: track when metadata is actually available (duration > 0) so loading UI is accurate.
      setMetadataReady(!!(d && d > 0));
    } catch (_) {}
    try {
      setVolume(event.target.getVolume());
    } catch (_) {}

    try {
      const iframeEl = event.target.getIframe ? event.target.getIframe() : null;
      if (iframeEl) {
        iframeEl.setAttribute('tabIndex', '-1');
        try {
          iframeEl.classList.add('youtube-iframe');
        } catch (_) {}
      }
    } catch (_) {}

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    updateIntervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      // CHANGE: keep UI in sync with *actual applied* quality (required). No reload/pause/seek.
      try {
        if (p.getPlaybackQuality) {
          const q = p.getPlaybackQuality();
          if (typeof q === 'string' && q && q !== lastReportedQualityRef.current) {
            lastReportedQualityRef.current = q;
            if (q !== actualPlaybackQualityRef.current) {
              actualPlaybackQualityRef.current = q;
              setActualPlaybackQuality(q);
            }

            try {
              const target = qualitySwitchTargetRef.current;
              if (qualitySwitchingRef.current && target && q === target) {
                qualitySwitchingRef.current = false;
                qualitySwitchTargetRef.current = null;
                setQualitySwitching(false);
                if (qualitySwitchTimeoutRef.current) {
                  clearTimeout(qualitySwitchTimeoutRef.current);
                  qualitySwitchTimeoutRef.current = null;
                }
                try {
                  if (qualitySwitchWasPlayingRef.current && p.playVideo) {
                    qualitySwitchWasPlayingRef.current = false;
                    p.playVideo();
                  }
                } catch (_) {
                  qualitySwitchWasPlayingRef.current = false;
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}

      try {
        if (p.getCurrentTime) {
          const ct = p.getCurrentTime();
          setCurrentTime(ct);

          try {
            const d = p.getDuration ? p.getDuration() : 0;
            if (d && d > 0 && (!durationRef.current || durationRef.current <= 0)) {
              setDuration(d);
              setMetadataReady(true);
            }
          } catch (_) {}

          if (hasUserStartedPlayback && !seekingEnabled && typeof ct === 'number' && ct > 0.25) {
            try {
              if (p.seekTo) p.seekTo(0, true);
            } catch (_) {}
            try {
              if (p.pauseVideo) p.pauseVideo();
            } catch (_) {}
            setCurrentTime(0);
          }
        }
      } catch (_) {}

      // Fallback: keep UI state in sync even if onStateChange is flaky.
      try {
        const st = p.getPlayerState ? p.getPlayerState() : null;
        if (st === null || st === undefined) return;

        try {
          const PLAYING = window?.YT?.PlayerState?.PLAYING;
          const BUFFERING = window?.YT?.PlayerState?.BUFFERING;

          const shouldBePlaying =
            typeof PLAYING === 'number' &&
            st === PLAYING &&
            hasUserStartedPlayback &&
            !startupCropActiveRef.current;

          if (shouldBePlaying && !playingRef.current) {
            setPlaying(true);
            playingRef.current = true;
          }

          if (shouldBePlaying) {
            try {
              const expected = resolvedVideoIdRef.current;
              if (expected) loadedVideoIdRef.current = expected;
            } catch (_) {}

            try {
              if (switchingVideoRef.current) {
                switchingVideoRef.current = false;
                setSwitchingVideo(false);
              }
            } catch (_) {}
          }

          if (shouldBePlaying && !canSeekRef.current) {
            setCanSeek(true);
            canSeekRef.current = true;
          }

          if (!shouldBePlaying && playingRef.current && st !== BUFFERING) {
            setPlaying(false);
            playingRef.current = false;
          }

          if (typeof BUFFERING === 'number' && st === BUFFERING && !bufferingRef.current) {
            setBuffering(true);
            bufferingRef.current = true;
          }

          if (typeof BUFFERING === 'number' && st !== BUFFERING && bufferingRef.current && shouldBePlaying) {
            setBuffering(false);
            bufferingRef.current = false;
          }
        } catch (_) {}

        if (lastPlayerStateRef.current !== st) {
          lastPlayerStateRef.current = st;

          // -1 UNSTARTED, 0 ENDED, 1 PLAYING, 2 PAUSED, 3 BUFFERING, 5 CUED
          if (st === 1) {
            if (!hasUserStartedPlayback || startupCropActiveRef.current) {
              try {
                if (p.pauseVideo) p.pauseVideo();
              } catch (_) {}
              try {
                if (p.seekTo) p.seekTo(0, true);
              } catch (_) {}
              setPlaying(false);
              playingRef.current = false;
              setShowControlsOverlay(false);
              setBuffering(false);
              bufferingRef.current = false;
              return;
            }
            try {
              lastPlayedVideoIdRef.current = resolvedVideoIdRef.current;
            } catch (_) {}
            try {
              switchingVideoRef.current = false;
              setSwitchingVideo(false);
            } catch (_) {}
            setPlaying(true);
            playingRef.current = true;
            setShowControlsOverlay(true);
            setBuffering(false);
            bufferingRef.current = false;
            setErrorMessage('');

            try {
              if (controlsHideTimeoutRef.current) {
                clearTimeout(controlsHideTimeoutRef.current);
              }
              controlsHideTimeoutRef.current = setTimeout(() => {
                if (playingRef.current) setShowControlsOverlay(false);
              }, 2000);
            } catch (_) {}
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
          } else if (st === 3) {
            setPlaying(false);
            playingRef.current = false;
            setShowControlsOverlay(false);
            setBuffering(true);
            bufferingRef.current = true;

            // CHANGE: slow-network stabilization. During the required preload gate, do NOT surface stall errors.
            if (!isPreloadingRef.current && !loadTimeoutRef.current) {
              loadTimeoutRef.current = setTimeout(() => {
                if (bufferingRef.current && !playingRef.current && !isPreloadingRef.current) {
                  setBuffering(false);
                  bufferingRef.current = false;
                  setErrorMessage('Network error, try again');
                }
              }, 15000);
            }
          } else if (st === 0) {
            setPlaying(false);
            playingRef.current = false;
            setShowControlsOverlay(false);
            setBuffering(false);
            bufferingRef.current = false;
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
            try {
              const d = p.getDuration ? p.getDuration() : 0;
              if (d && d > 0) {
                setDuration(d);
                setCurrentTime(d);
              }
            } catch (_) {}
          } else {
            setPlaying(false);
            playingRef.current = false;
            setShowControlsOverlay(false);
            setBuffering(false);
            bufferingRef.current = false;
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
          }
        }
      } catch (_) {}
    }, 250);

    const initialVideoId = pendingVideoIdRef.current;
    if (initialVideoId && event?.target) {
      try {
        setBuffering(false);
        bufferingRef.current = false;
        try {
          if (event.target.pauseVideo) event.target.pauseVideo();
        } catch (_) {}
        try {
          if (event.target.seekTo) event.target.seekTo(0, true);
        } catch (_) {}
        try {
          if (event.target.cueVideoById) event.target.cueVideoById(initialVideoId);
        } catch (_) {}
        loadedVideoIdRef.current = initialVideoId;
      } catch (_) {}
    }

    if (pendingShouldPlayRef.current && event?.target?.playVideo) {
      if (hasUserStartedPlayback && introCompleted) {
        pendingShouldPlayRef.current = false;
        try {
          if (startupCropActiveRef.current) {
            if (!splashRestoreRef.current) {
              splashRestoreRef.current = { muted: mutedRef.current, volume: volumeRef.current };
            }
            try {
              if (event.target.mute) event.target.mute();
            } catch (_) {}
          }
          event.target.playVideo();
        } catch (_) {}
      } else {
        pendingShouldPlayRef.current = false;
      }
    }

    try {
      if (startupCropActiveRef.current && splashMinElapsedRef.current && (playerReadyRef.current || playingRef.current)) {
        setSplashHardTimedOut(false);
        finishStartupSplash(splashStartPlaybackRef.current);
      }
    } catch (_) {}
  }, []);

  const handleStateChange = useCallback((event) => {
    const state = event.data;

    if (state === window.YT.PlayerState.PLAYING && !hasUserStartedPlayback) {
      try {
        if (event?.target?.pauseVideo) event.target.pauseVideo();
      } catch (_) {}
      try {
        if (event?.target?.seekTo) event.target.seekTo(0, true);
      } catch (_) {}
      setPlaying(false);
      playingRef.current = false;
      return;
    }

    if (state === window.YT.PlayerState.PLAYING && startupCropActiveRef.current) {
      try {
        if (event?.target?.pauseVideo) event.target.pauseVideo();
      } catch (_) {}
      try {
        if (event?.target?.seekTo) event.target.seekTo(0, true);
      } catch (_) {}
      setPlaying(false);
      playingRef.current = false;
      return;
    }

    if (
      state === window.YT.PlayerState.PLAYING ||
      state === window.YT.PlayerState.PAUSED ||
      state === window.YT.PlayerState.CUED ||
      state === window.YT.PlayerState.UNSTARTED ||
      state === window.YT.PlayerState.ENDED
    ) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      // Do NOT clear autoplayFallbackRef here; we want it to survive transient UNSTARTED/BUFFERING.
    }

    if (state === window.YT.PlayerState.PLAYING) {
      if (autoplayFallbackRef.current) {
        clearTimeout(autoplayFallbackRef.current);
        autoplayFallbackRef.current = null;
      }

      try {
        lastPlayedVideoIdRef.current = resolvedVideoIdRef.current;
      } catch (_) {}
      try {
        switchingVideoRef.current = false;
        setSwitchingVideo(false);
      } catch (_) {}

      try {
        setTimeout(() => {
          applyQualityWithRetry(qualityPreferenceRef.current);
        }, 0);
      } catch (_) {}
    }

    if (state === window.YT.PlayerState.PLAYING) {
      try {
        setSplashHardTimedOut(false);
      } catch (_) {}
      setPlaying(true);
      playingRef.current = true;
      try {
        const expected = resolvedVideoIdRef.current;
        if (expected) loadedVideoIdRef.current = expected;
      } catch (_) {}
      // CHANGE: SEEK ENABLEMENT (required). Only allow seeking when intro has completed and player is PLAYING.
      setCanSeek(true);
      canSeekRef.current = true;
      setBuffering(false);
      setErrorMessage('');
      bufferingRef.current = false;

      setShowControlsOverlay(true);

      try {
        if (controlsHideTimeoutRef.current) {
          clearTimeout(controlsHideTimeoutRef.current);
        }
        controlsHideTimeoutRef.current = setTimeout(() => {
          if (playingRef.current) setShowControlsOverlay(false);
        }, 2000);
      } catch (_) {}
      if (!updateIntervalRef.current) {
        updateIntervalRef.current = setInterval(() => {
          const p = playerRef.current;
          if (p && p.getCurrentTime) {
            try {
              setCurrentTime(p.getCurrentTime());
            } catch (_) {}
          }
        }, 250);
      }
      try {
        const d = event?.target?.getDuration ? event.target.getDuration() : 0;
        if (d && d > 0) {
          setDuration(d);
          setMetadataReady(true); // CHANGE: metadata now loaded
        }
      } catch (_) {}

      try {
        if (startupCropActiveRef.current && splashMinElapsedRef.current) {
          finishStartupSplash(splashStartPlaybackRef.current);
        }
      } catch (_) {}
    } else if (state === window.YT.PlayerState.PAUSED) {
      setPlaying(false);
      playingRef.current = false;
      // CHANGE: seeking disabled when not in PLAYING.
      setShowControlsOverlay(false);
      setBuffering(false);
      bufferingRef.current = false;
      try {
        const d = event?.target?.getDuration ? event.target.getDuration() : 0;
        if (d && d > 0) {
          setDuration(d);
          setMetadataReady(true); // CHANGE: metadata now loaded
        }
      } catch (_) {}
    } else if (state === window.YT.PlayerState.CUED) {
      setPlaying(false);
      playingRef.current = false;
      // CHANGE: seeking disabled when not in PLAYING.
      setShowControlsOverlay(false);
      setBuffering(false);
      bufferingRef.current = false;
      try {
        const d = event?.target?.getDuration ? event.target.getDuration() : 0;
        if (d && d > 0) {
          setDuration(d);
          setMetadataReady(true); // CHANGE: metadata loaded for newly cued video
        }
      } catch (_) {}

      // CHANGE: treat CUED as "metadata loaded" even if duration is temporarily 0 (prevents getting stuck in loading UI).
      setMetadataReady(true);

      // CHANGE: once the new video is cued and matches the current selection, exit the "switching/loading" stage.
      try {
        const expected = resolvedVideoIdRef.current;
        if (switchingVideoRef.current && expected && loadedVideoIdRef.current === expected) {
          switchingVideoRef.current = false;
          setSwitchingVideo(false);
        }
      } catch (_) {}
    } else if (state === window.YT.PlayerState.UNSTARTED) {
      setPlaying(false);
      playingRef.current = false;
      // CHANGE: seeking disabled when not in PLAYING.
      setShowControlsOverlay(false);
      setBuffering(false);
      bufferingRef.current = false;
    } else if (state === window.YT.PlayerState.BUFFERING) {
      setBuffering(true);
      bufferingRef.current = true;
      // CHANGE: seeking disabled while buffering (not actively PLAYING).
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      // CHANGE: slow-network stabilization. During required preload gate, do NOT start stall errors.
      if (!isPreloadingRef.current) {
        loadTimeoutRef.current = setTimeout(() => {
          if (bufferingRef.current && !playingRef.current && !isPreloadingRef.current) {
            setBuffering(false);
            setErrorMessage('Network error, try again');
          }
        }, 15000);
      }
    } else if (state === window.YT.PlayerState.ENDED) {
      setPlaying(false);
      playingRef.current = false;
      // CHANGE: seeking disabled when ended (not actively PLAYING).
      setShowControlsOverlay(false);
      setBuffering(false);
      setEnded(true);
      endedRef.current = true;
      try {
        const d = event?.target?.getDuration ? event.target.getDuration() : 0;
        if (d && d > 0) {
          setDuration(d);
          setCurrentTime(d);

          try {
            const freezeAt = Math.max(d - 0.25, 0);
            if (event?.target?.seekTo) event.target.seekTo(freezeAt, true);
            if (event?.target?.pauseVideo) event.target.pauseVideo();
          } catch (_) {}
        } else {
          setCurrentTime((prev) => (durationRef.current && durationRef.current > 0 ? durationRef.current : prev));
        }
      } catch (_) {
        setCurrentTime((prev) => (durationRef.current && durationRef.current > 0 ? durationRef.current : prev));
      }
      if (handleVideoEndRef.current) {
        handleVideoEndRef.current();
      }
    }
  }, [applyQualityWithRetry, finishStartupSplash]);

  useEffect(() => {
    pendingVideoIdRef.current = resolvedVideoId || null;
    const p = playerRef.current;
    if (!p || !resolvedVideoId) return;
    if (!playerReadyRef.current) return;
    if (loadedVideoIdRef.current === resolvedVideoId) return;

    try {
      setErrorMessage('');
      setBuffering(false);
      bufferingRef.current = false;
      try {
        if (p.pauseVideo) p.pauseVideo();
      } catch (_) {}
      try {
        if (p.seekTo) p.seekTo(0, true);
      } catch (_) {}
      try {
        if (p.cueVideoById) p.cueVideoById(resolvedVideoId);
      } catch (_) {}
      loadedVideoIdRef.current = resolvedVideoId;
    } catch (_) {}
  }, [resolvedVideoId]);

  // Initialize YouTube player (single instance) once we have a videoId
  useEffect(() => {
    let cancelled = false;

    const initPlayer = async () => {
      if (!resolvedVideoId) return;
      if (playerRef.current) return;
      if (!iframeRef.current) return;

      try {
        await loadYouTubeIframeAPI();
      } catch (e) {
        console.error('Failed to load YouTube IFrame API:', e);
        setBuffering(false);
        bufferingRef.current = false;
        setErrorMessage(e?.message || 'Network error, try again');
        return;
      }

      if (cancelled) return;

      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          host: 'https://www.youtube-nocookie.com',
          videoId: resolvedVideoId,
          playerVars,
          events: {
            onReady: handlePlayerReady,
            onStateChange: handleStateChange,
            onError: handleError
          }
        });

        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
        }
        readyTimeoutRef.current = setTimeout(() => {
          // CHANGE: slow-network stabilization. Do not fail the player "ready" stage before the 30s preload gate window.
          if (!playerReadyRef.current) {
            setBuffering(false);
            setErrorMessage('Network error, try again');
          }
        }, PRELOAD_GATE_MS);
      } catch (e) {
        console.error('Failed to initialize YouTube player:', e);
        setBuffering(false);
        bufferingRef.current = false;
        setErrorMessage(e?.message || 'Network error, try again');
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
    };
  }, [handleError, handlePlayerReady, handleStateChange, initNonce, playerVars, resolvedVideoId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (autoplayFallbackRef.current) {
        clearTimeout(autoplayFallbackRef.current);
      }
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
      if (startupCropTimeoutRef.current) {
        clearTimeout(startupCropTimeoutRef.current);
      }
      if (startupCropHardTimeoutRef.current) {
        clearTimeout(startupCropHardTimeoutRef.current);
      }
      if (qualityApplyTimeoutRef.current) {
        clearTimeout(qualityApplyTimeoutRef.current);
      }
      if (qualitySwitchTimeoutRef.current) {
        clearTimeout(qualitySwitchTimeoutRef.current);
      }
      // CHANGE: cleanup preload gate polling
      if (preloadGateIntervalRef.current) {
        clearInterval(preloadGateIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }
      playerRef.current = null;
      playerReadyRef.current = false;
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!hasUserStartedPlayback) return;
    // CHANGE: block playback controls while the required preload gate is active.
    if (isPreloadingRef.current) return;
    if (qualitySwitchingRef.current) return;
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) {
      return;
    }

    if (playing) {
      if (autoplayFallbackRef.current) {
        clearTimeout(autoplayFallbackRef.current);
        autoplayFallbackRef.current = null;
      }
      if (p.pauseVideo) p.pauseVideo();
      setBuffering(false);
      bufferingRef.current = false;
    } else {
      setErrorMessage('');

      markPlaybackInitiated();

      if (endedRef.current) {
        endedRef.current = false;
        setEnded(false);
        try {
          if (p.seekTo) p.seekTo(0, true);
        } catch (_) {}
        setCurrentTime(0);
      }

      setBuffering(true);
      bufferingRef.current = true;
      if (autoplayFallbackRef.current) {
        clearTimeout(autoplayFallbackRef.current);
      }
      autoplayFallbackRef.current = setTimeout(() => {
        if (!playingRef.current) {
          setBuffering(false);
          bufferingRef.current = false;
        }
      }, 2500);

      if (p.playVideo) p.playVideo();
    }
  }, [markPlaybackInitiated, playing]);

  const onOverlayPlayClick = useCallback(() => {
    if (hasUserStartedPlayback) return;
    // CHANGE: required preload gate blocks the overlay play button until satisfied.
    if (isPreloadingRef.current) return;

    pendingVideoId = resolvedVideoIdRef.current || pendingVideoIdRef.current || pendingVideoId || null;
    pendingVideoIdRef.current = pendingVideoId;
    hasUserStartedPlayback = true;
    permanentlyHideOverlay();

    const p = playerRef.current;
    markPlaybackInitiated();

    if (shouldShowIntro && !startupCropUsedRef.current) {
      startStartupSplash();
      return;
    }

    // CHANGE: if intro is not used for any reason, treat it as complete so seeking can be enabled during PLAYING.
    introCompleted = true;
    seekingEnabled = true;
    setIntroComplete(true);
    introCompleteRef.current = true;

    if (!p || !playerReadyRef.current) {
      pendingShouldPlayRef.current = true;
      return;
    }

    try {
      if (p.playVideo) p.playVideo();
    } catch (_) {}
  }, [markPlaybackInitiated, permanentlyHideOverlay, shouldShowIntro, startStartupSplash]);

  useEffect(() => {
    if (!playerReady) return;
    applyQualityWithRetry(qualityPreferenceRef.current);
  }, [applyQualityWithRetry, playerReady, resolvedVideoId]);

  useEffect(() => {
    if (!playerReady) return;
    const p = playerRef.current;
    if (!p) return;
    try {
      const levels = p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : [];
      if (Array.isArray(levels)) setAvailableQualityLevels(levels);
    } catch (_) {}
  }, [playerReady, resolvedVideoId]);

  useEffect(() => {
    if (!showQualityMenu) return;
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    try {
      const levels = p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : [];
      if (Array.isArray(levels)) setAvailableQualityLevels(levels);
    } catch (_) {}
  }, [showQualityMenu]);

  const toggleMute = useCallback(() => {
    if (qualitySwitchingRef.current) return;
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;

    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }, [muted]);

  const handleVolumeChange = useCallback((e) => {
    if (qualitySwitchingRef.current) return;
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;

    const newVolume = parseFloat(e.target.value);
    p.setVolume(newVolume);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((e) => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (qualitySwitchingRef.current) return;

    // CHANGE: SEEKING FIX (required). Allow seekTo ONLY when canSeek is true (PLAYING + intro complete).
    if (!canSeekRef.current) return;

    const newTime = parseFloat(e.target.value);
    const d = durationRef.current || 0;
    const clamped = d ? Math.min(newTime, d) : newTime;
    // CHANGE: SEEK BAR FIX (required). Drag updates thumb; release commits seekTo.
    setScrubTime(clamped);
    scrubTimeRef.current = clamped;
    lastSeekInteractionAtRef.current = Date.now();

    if (isScrubbingRef.current) return;

    if (endedRef.current) {
      endedRef.current = false;
      setEnded(false);
    }
    p.seekTo(clamped, true);
    setCurrentTime(clamped);
  }, []);

  const handleSeekStart = useCallback((e) => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (qualitySwitchingRef.current) return;
    if (!canSeekRef.current) return;

    isScrubbingRef.current = true;
    setIsScrubbing(true);

    const newTime = parseFloat(e?.target?.value);
    const d = durationRef.current || 0;
    const clamped = d ? Math.min(newTime, d) : newTime;
    scrubTimeRef.current = clamped;
    setScrubTime(clamped);
  }, []);

  const handleSeekEnd = useCallback(() => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (qualitySwitchingRef.current) return;
    isScrubbingRef.current = false;
    setIsScrubbing(false);

    // CHANGE: SEEK BAR FIX (required). Commit seekTo only when canSeek is true (PLAYING + intro complete).
    if (!canSeekRef.current) return;

    const target = scrubTimeRef.current;

    if (endedRef.current) {
      endedRef.current = false;
      setEnded(false);
    }

    try {
      p.seekTo(target, true);
    } catch (_) {}
    setCurrentTime(target);
  }, []);

  useEffect(() => {
    if (!isScrubbing) return;

    const onUp = () => {
      handleSeekEnd();
    };

    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('touchend', onUp, true);
    window.addEventListener('touchcancel', onUp, true);
    return () => {
      window.removeEventListener('mouseup', onUp, true);
      window.removeEventListener('touchend', onUp, true);
      window.removeEventListener('touchcancel', onUp, true);
    };
  }, [handleSeekEnd, isScrubbing]);

  const skipForward = useCallback(() => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (qualitySwitchingRef.current) return;

    // CHANGE: SEEKING FIX (required). Skip uses seekTo and is allowed ONLY when canSeek is true.
    if (!canSeekRef.current) return;
    const newTime = Math.min(currentTime + 10, duration);
    p.seekTo(newTime, true);
  }, [currentTime, duration]);

  const skipBackward = useCallback(() => {
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    if (loadedVideoIdRef.current && resolvedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoIdRef.current) return;
    if (qualitySwitchingRef.current) return;

    // CHANGE: SEEKING FIX (required). Skip uses seekTo and is allowed ONLY when canSeek is true.
    if (!canSeekRef.current) return;
    const newTime = Math.max(currentTime - 10, 0);
    p.seekTo(newTime, true);
  }, [currentTime]);

  const changePlaybackRate = useCallback((rate) => {
    if (qualitySwitchingRef.current) return;
    const p = playerRef.current;
    if (!p || !playerReadyRef.current) return;
    p.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (qualitySwitchingRef.current) return;
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Disable common YouTube hotkeys and devtools shortcuts while player is active
  useEffect(() => {
    const handler = (e) => {
      const container = containerRef.current;
      if (!container) return;

      const active = document.activeElement;
      const isInPlayer = active && container.contains(active);
      const isPlayerFullscreen = document.fullscreenElement && container.contains(document.fullscreenElement);

      if (!isInPlayer && !isPlayerFullscreen) return;

      const key = (e.key || '').toLowerCase();

      // Block devtools / view-source style shortcuts
      if (
        key === 'f12' ||
        (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (e.ctrlKey && key === 's')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block common YouTube player shortcuts
      const blockedKeys = new Set([
        ' ',
        'k',
        'j',
        'l',
        'm',
        'f',
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown'
      ]);

      if (blockedKeys.has(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveTime = isScrubbing ? scrubTime : currentTime;
  const safeCurrentTime = duration ? Math.min(effectiveTime, duration) : effectiveTime;
  const uiCurrentTime = duration ? (ended && !isScrubbing ? duration : safeCurrentTime) : safeCurrentTime;
  const sliderMax = duration || 0;
  const progressPercent = duration
    ? (uiCurrentTime >= duration - 0.05 ? 100 : Math.min(100, (uiCurrentTime / duration) * 100))
    : 0;

  const progressBackground = duration
    ? (progressPercent >= 99.9
        ? '#a855f7'
        : `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #4b5563 ${progressPercent}%, #4b5563 100%)`)
    : '#4b5563';

  const isError = !!errorMessage;
  const isLoading =
    (!isError && (!playerReady || !metadataReady || switchingVideo || isPreloading)) ||
    buffering ||
    (splashHardTimedOut && !playerReady && !playing); // CHANGE: include metadataReady/switchingVideo to make loading state correct on video switch/first open
  const suppressPausedOverlayDuringSplash = startupCrop && shouldShowIntro;
  const showPlayOverlay = !overlayPermanentlyHidden && !suppressPausedOverlayDuringSplash && !isError;
  const hasVideoIdMismatch = !!(resolvedVideoId && loadedVideoIdRef.current && loadedVideoIdRef.current !== resolvedVideoId);
  const ytPlayerState = (() => {
    try {
      const p = playerRef.current;
      if (!p || !playerReadyRef.current || !p.getPlayerState) return null;
      return p.getPlayerState();
    } catch (_) {
      return null;
    }
  })();
  const isActuallyPlaying = (() => {
    const PLAYING = window?.YT?.PlayerState?.PLAYING;
    if (typeof PLAYING === 'number' && ytPlayerState === PLAYING) return true;
    return !!(playingRef.current || playing);
  })();
  const showPausedEduflowOverlay =
    overlayPermanentlyHidden &&
    hasUserStartedPlayback &&
    !startupCrop &&
    !switchingVideo &&
    !hasVideoIdMismatch &&
    !qualitySwitching &&
    !buffering &&
    !isActuallyPlaying &&
    !isError;
  const shouldMaskIframe = !(
    overlayPermanentlyHidden &&
    isActuallyPlaying &&
    !buffering &&
    !ended &&
    !startupCrop &&
    !switchingVideo &&
    !hasVideoIdMismatch &&
    !isError
  );
  const showActionMask =
    shouldMaskIframe ||
    (qualitySwitching && hasUserStartedPlayback && !startupCrop && !switchingVideo && !hasVideoIdMismatch && !isError);
  const showActionLoading =
    qualitySwitching ||
    isScrubbing ||
    !!isScrubbingRef.current ||
    (Date.now() - (lastSeekInteractionAtRef.current || 0) < 800);

  return (
    <div 
      ref={containerRef}
      className={`bg-black rounded-lg overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className={`${isFullscreen ? 'flex-1 min-h-0 flex items-center justify-center' : ''}`}>
        <div
          className={`relative bg-black video-container ${isFullscreen ? 'w-full max-h-full aspect-video' : 'aspect-video'}`}
          onMouseMove={revealControls}
          onTouchStart={revealControls}
        >
          <div
            ref={iframeRef}
            className="w-full h-full"
            aria-label={title || 'Video'}
          />

          {showActionMask && (
            <div className="absolute inset-0 z-20 bg-black pointer-events-auto">
              {showActionLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-3"></div>
                  <p className="text-white text-sm font-semibold">loading...</p>
                </div>
              )}
            </div>
          )}

          {showPausedEduflowOverlay && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black pointer-events-none">
              <div className="text-white text-4xl md:text-5xl font-extrabold tracking-[0.35em]">
                EDUFLOW
              </div>
            </div>
          )}

          {startupCrop && shouldShowIntro && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black pointer-events-auto">
              <div className="flex flex-col items-center">
                <div className="text-white text-4xl md:text-5xl font-extrabold tracking-[0.35em] animate-pulse">
                  EDUFLOW
                </div>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-3 w-3 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-3 w-3 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

        {/* Paused / Loading / Error Overlay (opaque black) */}
          {!suppressPausedOverlayDuringSplash && isError && (
            <>
              <div className="absolute inset-0 z-30 bg-black pointer-events-auto" />
              <div className="absolute inset-0 z-50 flex items-center justify-center text-white pointer-events-none">
                <div className={`px-6 pointer-events-auto ${isRTL ? 'text-right' : 'text-center'}`}>
                  <>
                    <p className="text-white text-sm font-semibold" dir={isRTL ? 'rtl' : 'ltr'}>{translatedErrorMessage}</p>
                    <p className="text-white text-xs mt-2 opacity-90" dir={isRTL ? 'rtl' : 'ltr'}>{t('tryAgain')}</p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition pointer-events-auto"
                    >
                      {t('retry')}
                    </button>
                  </>
                </div>
              </div>
            </>
          )}

          {showPlayOverlay && (
            <>
              <div ref={playOverlayRef} className="absolute inset-0 z-30 bg-black pointer-events-auto" />
              <div className="absolute inset-0 z-50 flex items-center justify-center text-white pointer-events-none">
                <div className={`px-6 pointer-events-auto ${isRTL ? 'text-right' : 'text-center'}`}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-white text-sm font-semibold" dir={isRTL ? 'rtl' : 'ltr'}>{t('loading')}</p>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onOverlayPlayClick}
                      className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center transition hover:bg-purple-700 pointer-events-auto"
                      aria-label="Play video"
                    >
                      <Play className="w-10 h-10 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Custom Controls */}
          <div
            className={`absolute left-0 right-0 bottom-0 z-40 transition-opacity duration-200 ${
              (!overlayPermanentlyHidden || switchingVideo || hasVideoIdMismatch || qualitySwitching || (startupCrop && shouldShowIntro))
                ? 'opacity-0 pointer-events-none'
                : (!playerReady || buffering || !!errorMessage)
                ? 'opacity-0 pointer-events-none'
                : (playing
                    ? (showControlsOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none')
                    : 'opacity-100')
            }`}
          >
            <div className="px-3 pt-6 pb-3 bg-gradient-to-t from-black/40 to-transparent">
              {/* Progress Bar */}
              <div className="mb-2">
                <input
                  type="range"
                  min={0}
                  max={sliderMax || 0}
                  step={0.1}
                  value={sliderMax ? (ended ? sliderMax : Math.min(uiCurrentTime, sliderMax)) : 0}
                  onChange={handleSeek}
                  onMouseDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  disabled={!playerReady || switchingVideo || hasVideoIdMismatch || qualitySwitching || !canSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  style={{
                    background: progressBackground
                  }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePlayPause}
                    className="p-1.5 hover:bg-purple-700 rounded transition"
                    title={playing ? 'Pause' : 'Play'}
                    disabled={!playerReady || qualitySwitching}
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={skipBackward}
                    className="p-1.5 hover:bg-purple-700 rounded transition"
                    title="Skip back 10s"
                    disabled={!playerReady || qualitySwitching || !canSeek}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={skipForward}
                    className="p-1.5 hover:bg-purple-700 rounded transition"
                    title="Skip forward 10s"
                    disabled={!playerReady || qualitySwitching || !canSeek}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-1.5 hover:bg-purple-700 rounded transition"
                    title={muted ? 'Unmute' : 'Mute'}
                    disabled={!playerReady || qualitySwitching}
                  >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    disabled={!playerReady || qualitySwitching}
                  />

                  <span className="text-xs">
                    {formatTime(uiCurrentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSpeedMenu(!showSpeedMenu);
                        setShowQualityMenu(false);
                      }}
                      className="p-1.5 hover:bg-purple-700 rounded transition flex items-center space-x-1"
                      title="Playback Speed"
                      disabled={!playerReady || qualitySwitching}
                    >
                      <Gauge className="w-4 h-4" />
                      <span className="text-xs">{playbackRate}×</span>
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-purple-700 transition ${playbackRate === rate ? 'bg-purple-600' : ''}`}
                            disabled={qualitySwitching}
                          >
                            {rate}×
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        if (qualitySwitchingRef.current) return;
                        setShowQualityMenu(!showQualityMenu);
                        setShowSpeedMenu(false);
                      }}
                      className="p-1.5 hover:bg-purple-700 rounded transition flex items-center space-x-1"
                      title="Quality"
                      disabled={!playerReady || qualitySwitching}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-xs">{qualityLabel(displayedQualityPreference)}</span>
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        {qualityOptions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              if (!isQualitySelectable(q)) return;
                              applyQualityPreference(q);
                            }}
                            disabled={!isQualitySelectable(q)}
                            className={`block w-full px-4 py-2 text-left text-sm transition ${
                              isQualitySelectable(q) ? 'hover:bg-purple-700' : 'opacity-50 cursor-not-allowed'
                            } ${displayedQualityPreference === q ? 'bg-purple-600' : ''}`}
                          >
                            {qualityLabel(q)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:bg-purple-700 rounded transition"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    disabled={!playerReady || qualitySwitching}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Title (below video) */}
      {title && !isFullscreen && (
        <div className="bg-gray-900 p-4">
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default CustomYouTubePlayer;
