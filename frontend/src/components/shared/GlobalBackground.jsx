import React from 'react';

export default function GlobalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-white">
      {/* Landing page video filling the screen */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      
      {/* Soft light blue overlay to maintain the light theme, WITHOUT blur so the video is clear */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#E8F2FA]/50 to-[#DFEDFA]/40"></div>
    </div>
  );
}
