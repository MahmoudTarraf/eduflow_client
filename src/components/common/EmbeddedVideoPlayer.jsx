import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Gauge, Minimize } from 'lucide-react';

const DEFAULT_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const ensureTokenInUrl = (url) => {
  if (!url) return '';
  try {
    const token = localStorage.getItem('token');
    const resolved = new URL(url, window.location.origin);
    if (token && !resolved.searchParams.has('token')) {
      resolved.searchParams.set('token', token);
    }
    return resolved.toString();
  } catch (err) {
    console.warn('[EmbeddedVideoPlayer] Invalid URL', { url, err });
    return url;
  }
};

const EmbeddedVideoPlayer = ({ videoUrl: initialUrl, title, autoPlay = false, contentId, onComplete }) => {
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!initialUrl) return;
    const resolved = ensureTokenInUrl(initialUrl);
    setVideoUrl(resolved);
    setLoading(true);
    setError(null);
  }, [initialUrl]);

  useEffect(() => {
    try {
      sessionStorage.setItem('videoPlaybackRate', String(playbackRate));
    } catch (_) {}
  }, [playbackRate]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLoadedData = useCallback(() => {
    setPlayerReady(true);
    setLoading(false);
  }, []);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setBuffering(false);
    setLoading(false);
  }, []);

  const handlePause = useCallback(() => {
    setPlaying(false);
    setBuffering(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setBuffering(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setBuffering(false);
    setLoading(false);
  }, []);

  const handleError = useCallback((e) => {
    setError('Failed to load video. Please try again.');
    setPlaying(false);
    setBuffering(false);
    setLoading(false);
  }, []);

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
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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
    }
  }, []);

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
    if (contentId && !completedRef.current && videoRef.current) {
      completedRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        const axios = (await import('axios')).default;
        
        const watchedDuration = videoRef.current.currentTime || duration;
        const totalDuration = duration || videoRef.current.duration;
        const watchedRes = await axios.post(
          `/api/content/${contentId}/watched`,
          { watchedDuration, totalDuration },
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

          const hasRewards = (g) => g && (
            (g.pointsAwarded && g.pointsAwarded > 0) ||
            (Array.isArray(g.awardedBadges) && g.awardedBadges.length > 0) ||
            !!g.assignedTitle ||
            !!g.courseAward
          );

          let gamificationData = null;
          if (hasRewards(completeGam)) gamificationData = completeGam;
          else if (hasRewards(watchedGam)) gamificationData = watchedGam;
          else gamificationData = completeGam || watchedGam || null;

          if (gamificationData) {
            fireGamificationEvents(gamificationData);
          } else {
            showGamificationToast('videoCompleted', '🎬 Video completed! Keep learning!');
          }
        } catch (e) {
          console.error('[EmbeddedVideoPlayer] Error firing gamification events:', e);
        }

        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error marking video as complete:', error);
        completedRef.current = false;
      }
    }
  }, [contentId, onComplete, duration]);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
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

        {/* Loading/Buffering Overlay */}
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

        {/* Play Button Overlay */}
        {!error && playerReady && !loading && !buffering && !playing && (
          <button
            type="button"
            onClick={togglePlayPause}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 text-white transition focus:outline-none hover:bg-black/40"
            aria-label="Play video"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
              <Play className="w-10 h-10 ml-1" />
            </div>
          </button>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
            <div className="text-center px-6">
              <p className="text-white mb-4 text-sm md:text-base">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-20">
          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Volume */}
              <button
                onClick={() => setMuted(!muted)}
                className="p-1.5 hover:bg-white/20 rounded transition"
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
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              {/* Time */}
              <span className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-1.5 hover:bg-white/20 rounded transition flex items-center space-x-1"
                  title="Playback Speed"
                >
                  <Gauge className="w-4 h-4" />
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

              {/* Fullscreen */}
              <button
                onClick={toggleFullScreen}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
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

export default EmbeddedVideoPlayer;
