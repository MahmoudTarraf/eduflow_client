import React from 'react';

const StreakFlameIcon = ({ className = "w-6 h-6", animated = false, glowing = false }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${animated ? 'animate-pulse' : ''} ${glowing ? 'drop-shadow-lg' : ''}`}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="30%" stopColor="#FF8E53" />
            <stop offset="60%" stopColor="#FFB366" />
            <stop offset="100%" stopColor="#FFD93D" />
          </linearGradient>
          <linearGradient id="inner-flame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF8E53" />
            <stop offset="50%" stopColor="#FFB366" />
            <stop offset="100%" stopColor="#FFE066" />
          </linearGradient>
          {glowing && (
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        {/* Main flame shape */}
        <path
          d="M12 2C10 4 8 6 8 10C8 14 10 16 12 16C12 14 13 12 15 10C17 12 18 14 18 16C18 19 15.5 22 12 22C7.5 22 4 18.5 4 14C4 8 8 4 12 2Z"
          fill="url(#flame-gradient)"
          className={`${animated ? 'animate-bounce' : ''}`}
          style={{
            filter: glowing ? 'url(#glow)' : 'none',
            animationDuration: animated ? '2s' : 'none',
            animationIterationCount: animated ? 'infinite' : 'none'
          }}
        />
        
        {/* Inner flame highlight */}
        <path
          d="M12 6C11 7 10 8 10 11C10 13 11 14 12 14C12 13 12.5 12 14 11C15 12 15.5 13 15.5 14C15.5 16 14 18 12 18C9.5 18 7.5 16 7.5 13C7.5 9 10 7 12 6Z"
          fill="url(#inner-flame)"
          opacity="0.8"
        />
        
        {/* Hot spots */}
        <ellipse cx="12" cy="12" rx="1" ry="1.5" fill="#FFE066" opacity="0.9"/>
        <ellipse cx="11.5" cy="9" rx="0.5" ry="1" fill="#FFFF66" opacity="0.7"/>
      </svg>
      
      {/* Animated sparks for special effects */}
      {animated && (
        <>
          <div className="absolute -top-1 -right-1 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1 -left-1 w-0.5 h-0.5 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-1 right-0 w-0.5 h-0.5 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </>
      )}
    </div>
  );
};

export default StreakFlameIcon;
