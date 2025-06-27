
import React from 'react';

const KlamAIVerticalLeft = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      width="120"
      height="400"
      viewBox="0 0 120 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* k */}
      <g transform="translate(20, 320)">
        <path d="M0 0 L0 -60 M0 -30 L25 -60 M0 -30 L25 0" stroke="url(#gradient-left)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      
      {/* l */}
      <g transform="translate(60, 320)">
        <path d="M0 0 L0 -60" stroke="url(#gradient-left)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      </g>
      
      {/* a */}
      <g transform="translate(20, 240)">
        <circle cx="15" cy="-15" r="12" stroke="url(#gradient-left)" strokeWidth="6" fill="none"/>
        <path d="M27 -3 L27 0 M27 -15 L27 0" stroke="url(#gradient-left)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      </g>
      
      {/* m */}
      <g transform="translate(20, 180)">
        <path d="M0 0 L0 -30 M0 -30 Q5 -35 10 -30 L10 -5 M10 -30 Q15 -35 20 -30 L20 -5" stroke="url(#gradient-left)" strokeWidth="5" fill="none" strokeLinecap="round"/>
      </g>
      
      {/* A */}
      <g transform="translate(30, 120)">
        <path d="M0 0 L15 -40 L30 0 M7.5 -20 L22.5 -20" stroke="url(#gradient-left)" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      
      {/* I */}
      <g transform="translate(45, 60)">
        <path d="M0 0 L0 -40 M-10 0 L10 0 M-10 -40 L10 -40" stroke="url(#gradient-left)" strokeWidth="7" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
};

export default KlamAIVerticalLeft;
