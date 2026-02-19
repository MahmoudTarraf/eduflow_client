import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Gauge, SkipForward, SkipBack } from 'lucide-react';

// SecureYouTubePlayer
// Renders a secure iframe (served from /secure/video/:contentId) and communicates
// with it via postMessage to control playback while keeping YouTube hidden.
const SecureYouTubePlayer = ({
  secureUrl,
  title,
  autoPlay = false,
  contentId,
  onComplete
}) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const completedRef = useRef(false);

  const allowedOrigin = useMemo(() => {
    if (!secureUrl) return window.location.origin;
    try {
      const url = new URL(secureUrl, window.location.origin);
      return url.origin;
    } catch (_) {
      return window.location.origin;
    }
  }, [secureUrl]);

  const postToIframe = useCallback((message) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, allowedOrigin);
      }
    } catch (e) {
      // ignore
    }
  }, [allowedOrigin]);

  // Listen for events from secure iframe
  useEffect(() => {
    const handler = (event) => {
      // Only accept messages from the secure iframe origin
      if (event.origin !== allowedOrigin) return;
      const data = event.data || {};

      switch (data.type) {
        case 'videoReady':
          setPlayerReady(true);
          if (typeof data.duration === 'number') setDuration(data.duration);
          if (autoPlay) {
            postToIframe({ type: 'play' });
          }
          break;
        case 'timeUpdate':
          if (typeof data.currentTime === 'number') setCurrentTime(data.currentTime);
          if (typeof data.duration === 'number') setDuration(data.duration);
          break;
        case 'stateChange':
          if (data.state === 'playing') {
            setPlaying(true);
            setBuffering(false);
          } else if (data.state === 'paused') {
            setPlaying(false);
            setBuffering(false);
          } else if (data.state === 'buffering') {
            setBuffering(true);
          } else if (data.state === 'ended') {
            setPlaying(false);
          }
          break;
        case 'videoEnded':
          if (!completedRef.current) {
            completedRef.current = true;
            handleVideoEnd();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, allowedOrigin]);

  const handleVideoEnd = useCallback(async () => {
    if (!contentId) {
      if (onComplete) onComplete();
      return;
    }

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
        console.error('[SecureYouTubePlayer] Error firing gamification events:', e);
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('[SecureYouTubePlayer] Error marking video as complete:', error);
      completedRef.current = false;
    }
  }, [contentId, duration, onComplete]);

  const togglePlayPause = useCallback(() => {
    if (!playerReady) return;
    postToIframe({ type: playing ? 'pause' : 'play' });
  }, [playerReady, playing, postToIframe]);

  const toggleMute = useCallback(() => {
    if (!playerReady) return;
    if (muted) {
      postToIframe({ type: 'unmute' });
      setMuted(false);
    } else {
      postToIframe({ type: 'mute' });
      setMuted(true);
    }
  }, [playerReady, muted, postToIframe]);

  const handleVolumeChange = useCallback((e) => {
    if (!playerReady) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
    postToIframe({ type: 'setVolume', volume: newVolume });
  }, [playerReady, postToIframe]);

  const handleSeek = useCallback((e) => {
    if (!playerReady) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    postToIframe({ type: 'seek', time: newTime });
  }, [playerReady, postToIframe]);

  const skipForward = useCallback(() => {
    if (!playerReady) return;
    const newTime = Math.min(currentTime + 10, duration);
    setCurrentTime(newTime);
    postToIframe({ type: 'seek', time: newTime });
  }, [playerReady, currentTime, duration, postToIframe]);

  const skipBackward = useCallback(() => {
    if (!playerReady) return;
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    postToIframe({ type: 'seek', time: newTime });
  }, [playerReady, currentTime, postToIframe]);

  const changePlaybackRate = useCallback((rate) => {
    if (!playerReady) return;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    postToIframe({ type: 'setPlaybackRate', rate });
  }, [playerReady, postToIframe]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative aspect-video bg-black">
        {/* Secure iframe from backend */}
        <iframe
          ref={iframeRef}
          src={secureUrl}
          className="w-full h-full"
          title={title || 'Secure Video'}
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />

        {/* Buffering Overlay */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-black/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-white text-xs uppercase tracking-widest">Buffering…</p>
            </div>
          </div>
        )}

        {/* Play Button Overlay */}
        {!playing && playerReady && !buffering && (
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

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 z-40">
          <div className="mb-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #4b5563 ${progressPercent}%, #4b5563 100%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlayPause}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title={playing ? 'Pause' : 'Play'}
                disabled={!playerReady}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={skipBackward}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title="Skip back 10s"
                disabled={!playerReady}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={skipForward}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title="Skip forward 10s"
                disabled={!playerReady}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title={muted ? 'Unmute' : 'Mute'}
                disabled={!playerReady}
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
                disabled={!playerReady}
              />

              <span className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-1.5 hover:bg-white/20 rounded transition flex items-center space-x-1"
                  title="Playback Speed"
                  disabled={!playerReady}
                >
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs">{playbackRate}×</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackRate(speed)}
                        className={`block w-full px-4 py-2 text-left text-sm transition ${
                          playbackRate === speed
                            ? 'bg-purple-600 text-white'
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
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/20 rounded transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
            EduFlow Secure
          </div>
        </div>
      </div>

      {title && !isFullscreen && (
        <div className="bg-gray-900 p-4">
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default SecureYouTubePlayer;
