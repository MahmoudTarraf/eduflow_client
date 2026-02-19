import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const createDebugId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const ensureTokenInUrl = (url) => {
  if (!url) return '';
  try {
    const token = localStorage.getItem('token');
    const resolved = new URL(url, window.location.origin);
    if (token && !resolved.searchParams.has('token')) {
      resolved.searchParams.set('token', token);
    }
    const finalUrl = resolved.toString();
    console.log('[VideoPlayer] ensureTokenInUrl', { finalUrl });
    return finalUrl;
  } catch (err) {
    console.warn('[VideoPlayer] Invalid URL', { url, err });
    return url;
  }
};

const VideoPlayer = ({ videoUrl: initialUrl, onClose, title, autoPlay = false, contentId, onComplete }) => {
  const debugIdRef = useRef(createDebugId());
  const debugId = debugIdRef.current;
  const completedRef = useRef(false);

  const [videoUrl, setVideoUrl] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(() => {
    const stored = sessionStorage.getItem('videoPlaybackRate');
    const num = Number(stored);
    return !isNaN(num) && num > 0 ? num : 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const videoRef = useRef(null);
  const log = useCallback(
    (event, data = null) => {
      console.log(`[VideoPlayer:${debugId}] ${event}`, data);
    },
    [debugId]
  );

  useEffect(() => {
    if (!initialUrl) return;
    const resolved = ensureTokenInUrl(initialUrl);
    setVideoUrl(resolved);
    setLoading(true);
    setError(null);
    log('url:set', resolved);
  }, [initialUrl, log]);

  useEffect(() => {
    try {
      sessionStorage.setItem('videoPlaybackRate', String(playbackRate));
    } catch (_) {}
  }, [playbackRate]);

  const handleLoadedData = useCallback(() => {
    log('video:loaded');
    setPlayerReady(true);
    setLoading(false);
  }, [log]);

  const handlePlay = useCallback(() => {
    log('video:play');
    setPlaying(true);
    setBuffering(false);
    setLoading(false);
  }, [log]);

  const handlePause = useCallback(() => {
    log('video:pause');
    setPlaying(false);
    setBuffering(false);
  }, [log]);

  const handleWaiting = useCallback(() => {
    log('video:buffering');
    setBuffering(true);
  }, [log]);

  const handlePlaying = useCallback(() => {
    log('video:playing');
    setBuffering(false);
    setLoading(false);
  }, [log]);

  const handleError = useCallback(
    (e) => {
      log('video:error', e);
      setError('Failed to load video. Please try again.');
      setPlaying(false);
      setBuffering(false);
      setLoading(false);
    },
    [log]
  );

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((e) => handleError(e));
    } else {
      videoRef.current.pause();
    }
  }, [handleError]);

  const handleVolumeChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setMuted(value === 0);
    if (videoRef.current) videoRef.current.volume = value;
  }, []);

  const toggleFullScreen = useCallback(() => {
    const container = document.querySelector('.video-player-container');
    if (!container) return;
    if (!document.fullscreenElement) container.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setBuffering(false);
    if (videoRef.current) {
      videoRef.current.load();
      if (autoPlay) videoRef.current.play().catch(() => {});
    }
  }, [autoPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !seeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [seeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      log('video:metadata', { duration: videoRef.current.duration });
    }
  }, [log]);

  const handleSeek = useCallback((e) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  }, []);

  const handleSeekStart = useCallback(() => {
    setSeeking(true);
  }, []);

  const handleSeekEnd = useCallback(() => {
    setSeeking(false);
  }, []);

  const handleEnded = useCallback(async () => {
    log('video:ended');
    
    // Mark as completed if contentId is provided and not already marked
    if (contentId && !completedRef.current && videoRef.current) {
      completedRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        const axios = (await import('axios')).default;
        
        const watchedDuration = videoRef.current.currentTime || duration;
        const totalDuration = duration || videoRef.current.duration;
        
        // Mark video as watched with 100% completion
        await axios.post(
          `/api/content/${contentId}/watched`,
          {
            watchedDuration,
            totalDuration
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        log('video:marked-watched', { contentId, watchedDuration, totalDuration });
        
        // Also mark as complete in the general endpoint
        const completeResponse = await axios.post(
          `/api/content/${contentId}/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        log('video:marked-complete', { contentId });
        
        // Fire gamification events if present
        try {
          const gam = completeResponse?.data?.gamification;
          if (gam && gam.pointsAwarded && gam.pointsAwarded > 0) {
            console.log('🎬 VideoPlayer: Firing gamification events for video completion (points awarded)');
            const { fireGamificationEvents } = await import('../../utils/gamificationUtils');
            fireGamificationEvents(gam);
          } else {
            // Fire a simple video completion toast when no points were awarded (duplicate watch)
            console.log('🎬 VideoPlayer: Firing simple video completion toast');
            const { showGamificationToast } = await import('../common/ToastManager');
            showGamificationToast('videoCompleted', '🎬 Video completed! Keep learning!');
          }
        } catch (error) {
          console.error('🎬 VideoPlayer: Error firing gamification events:', error);
        }
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error marking video as complete:', error);
        completedRef.current = false; // Reset so it can retry
      }
    }
  }, [contentId, onComplete, log, duration]);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="video-player-container relative w-full max-w-5xl mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg truncate pr-4">
              {title || 'Video Player'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain rounded-lg"
              controls={false}
              autoPlay={autoPlay}
              muted={muted}
              playsInline
              onLoadedData={handleLoadedData}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onWaiting={handleWaiting}
              onPlaying={handlePlaying}
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeekStart}
              onSeeked={handleSeekEnd}
              onEnded={handleEnded}
              onClick={togglePlayPause}
            />

            {(loading || buffering) && !error && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                  <p className="text-white text-xs uppercase tracking-widest">
                    {loading ? 'Loading…' : 'Buffering…'}
                  </p>
                </div>
              </div>
            )}

            {!error && playerReady && !loading && !buffering && !playing && (
              <button
                type="button"
                onClick={togglePlayPause}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 text-white transition focus:outline-none"
                aria-label="Resume playback"
              >
                <Play className="w-16 h-16" />
              </button>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                <div className="text-center px-6">
                  <p className="text-white mb-4 text-sm md:text-base">{error}</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Retry
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-20">
            {/* Seek Bar */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-white text-xs mb-1">
                <span className="min-w-[45px] text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #4b5563 ${progressPercent}%, #4b5563 100%)`
                  }}
                />
                <span className="min-w-[45px]">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                  title={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMuted(!muted)}
                    className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="p-2 hover:bg-white/20 rounded-lg transition text-white flex items-center gap-1"
                    title="Playback Speed"
                  >
                    <Gauge className="w-5 h-5" />
                    <span className="text-xs">{playbackRate}×</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                      {DEFAULT_SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            if (videoRef.current) videoRef.current.playbackRate = speed;
                            setPlaybackRate(speed);
                            setShowSpeedMenu(false);
                          }}
                          className={`block w-full px-4 py-2 text-left text-sm transition ${
                            playbackRate === speed
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {speed}×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleFullScreen}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPlayer;
