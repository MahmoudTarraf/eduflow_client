import React, { useEffect, useMemo, useRef } from 'react';

export const DEFAULT_BRANDED_VIDEO_INTRO = {
  enabled: true,
  durationMs: 3200,
  preset: 'sweep',
  soundSrc: '',
  soundVolume: 0.15,
  brandText: 'EduFlow',
  subtitleText: 'Learning Platform'
};

const clampMs = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(4000, Math.floor(n)));
};

const normalizeIntro = (intro) => {
  const input = intro && typeof intro === 'object' ? intro : {};

  return {
    enabled: input.enabled !== false,
    durationMs: clampMs(input.durationMs, DEFAULT_BRANDED_VIDEO_INTRO.durationMs),
    preset: typeof input.preset === 'string' && input.preset ? input.preset : DEFAULT_BRANDED_VIDEO_INTRO.preset,
    soundSrc: typeof input.soundSrc === 'string' ? input.soundSrc : DEFAULT_BRANDED_VIDEO_INTRO.soundSrc,
    soundVolume:
      typeof input.soundVolume === 'number' && Number.isFinite(input.soundVolume)
        ? Math.max(0, Math.min(1, input.soundVolume))
        : DEFAULT_BRANDED_VIDEO_INTRO.soundVolume,
    brandText: typeof input.brandText === 'string' && input.brandText ? input.brandText : DEFAULT_BRANDED_VIDEO_INTRO.brandText,
    subtitleText:
      typeof input.subtitleText === 'string'
        ? input.subtitleText
        : DEFAULT_BRANDED_VIDEO_INTRO.subtitleText
  };
};

const BrandedVideoIntroOverlay = ({
  open,
  intro,
  isRTL,
  onDone,
  timerActive = true,
  skipOnClick = true,
  onPrimaryAction,
  className
}) => {
  const cfg = useMemo(() => normalizeIntro(intro), [intro]);
  const doneRef = useRef(false);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!open) {
      doneRef.current = false;
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !cfg.enabled || !timerActive) return;

    doneRef.current = false;

    try {
      if (cfg.soundSrc) {
        const audio = new Audio(cfg.soundSrc);
        audio.volume = cfg.soundVolume;
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    } catch (_) {}

    timerRef.current = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        onDone && onDone();
      } catch (_) {}
    }, cfg.durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        const a = audioRef.current;
        if (a) {
          a.pause();
          a.currentTime = 0;
        }
      } catch (_) {}
      audioRef.current = null;
    };
  }, [cfg.durationMs, cfg.enabled, cfg.soundSrc, cfg.soundVolume, onDone, open, timerActive]);

  const finishNow = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    } catch (_) {}
    audioRef.current = null;

    try {
      onDone && onDone();
    } catch (_) {}
  };

  if (!open || !cfg.enabled || cfg.durationMs <= 0) return null;

  const animating = !!timerActive;

  return (
    <div
      className={`eduflow-intro-overlay ${animating ? 'eduflow-intro-animating' : ''} ${className || ''}`}
      style={{
        '--eduflow-intro-duration': `${cfg.durationMs}ms`
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`eduflow-intro-card eduflow-intro-${cfg.preset} ${animating ? 'eduflow-intro-animating' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (skipOnClick) {
            finishNow();
            return;
          }
          try {
            onPrimaryAction && onPrimaryAction();
          } catch (_) {}
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (skipOnClick) {
              finishNow();
              return;
            }
            try {
              onPrimaryAction && onPrimaryAction();
            } catch (_) {}
          }
        }}
        aria-label="Skip intro"
      >
        <div className="eduflow-intro-logoWrap">
          <div className="eduflow-intro-logoBadge">
            <span className="eduflow-intro-logoLetter">E</span>
          </div>
          <div className={`eduflow-intro-text ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="eduflow-intro-brand">{cfg.brandText}</div>
            {cfg.subtitleText ? <div className="eduflow-intro-subtitle">{cfg.subtitleText}</div> : null}
          </div>
        </div>
        <div className="eduflow-intro-sweep" />
        <div className="eduflow-intro-orb eduflow-intro-orbA" />
        <div className="eduflow-intro-orb eduflow-intro-orbB" />
        <div className="eduflow-intro-orb eduflow-intro-orbC" />
      </div>
    </div>
  );
};

export default BrandedVideoIntroOverlay;
