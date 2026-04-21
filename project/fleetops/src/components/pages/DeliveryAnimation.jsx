import React from 'react'

export default function DeliveryAnimation() {
  return (
    <div className="delivery-scene" aria-hidden="true">
      <svg
        viewBox="0 0 520 380"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Road gradient */}
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2d2d2d" stopOpacity="0" />
            <stop offset="20%" stopColor="#2d2d2d" />
            <stop offset="80%" stopColor="#2d2d2d" />
            <stop offset="100%" stopColor="#2d2d2d" stopOpacity="0" />
          </linearGradient>

          {/* Sky gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>

          {/* Ground gradient */}
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a2f1a" />
            <stop offset="100%" stopColor="#0d1a0d" />
          </linearGradient>

          {/* Van body gradient */}
          <linearGradient id="vanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5c842" />
            <stop offset="100%" stopColor="#d4a820" />
          </linearGradient>

          {/* Scooter gradient */}
          <linearGradient id="scooterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Bike gradient */}
          <linearGradient id="bikeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
          </filter>

          {/* Isometric building shadow */}
          <filter id="buildShadow">
            <feDropShadow dx="3" dy="6" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {/* Headlight glow */}
          <radialGradient id="headlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff9c4" stopOpacity="0" />
          </radialGradient>

          {/* Star/dot pattern */}
          <pattern id="stars" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.8" fill="white" opacity="0.4" />
            <circle cx="20" cy="15" r="0.5" fill="white" opacity="0.3" />
            <circle cx="35" cy="8" r="0.7" fill="white" opacity="0.5" />
            <circle cx="12" cy="30" r="0.6" fill="white" opacity="0.2" />
            <circle cx="28" cy="35" r="0.9" fill="white" opacity="0.4" />
          </pattern>
        </defs>

        {/* ── Sky ── */}
        <rect x="0" y="0" width="520" height="260" fill="url(#skyGrad)" />
        <rect x="0" y="0" width="520" height="260" fill="url(#stars)" />

        {/* Moon */}
        <circle cx="460" cy="40" r="22" fill="#f0e68c" opacity="0.9" filter="url(#glow)" />
        <circle cx="470" cy="35" r="18" fill="#1e3a5f" />

        {/* ── City Buildings (Isometric style) ── */}
        {/* Building 1 - tall */}
        <g filter="url(#buildShadow)" className="building-1">
          <polygon points="60,210 60,120 90,105 90,195" fill="#2a4a6b" />
          <polygon points="60,120 90,105 120,120 90,135" fill="#3a6090" />
          <polygon points="90,135 120,120 120,210 90,225" fill="#1e3555" />
          {/* Windows */}
          <rect x="65" y="130" width="8" height="8" fill="#f5c842" opacity="0.8" className="window-blink" />
          <rect x="78" y="130" width="8" height="8" fill="#f5c842" opacity="0.4" />
          <rect x="65" y="148" width="8" height="8" fill="#f5c842" opacity="0.9" className="window-blink" style={{ animationDelay: '0.5s' }} />
          <rect x="78" y="148" width="8" height="8" fill="#f5c842" opacity="0.6" />
          <rect x="65" y="166" width="8" height="8" fill="#f5c842" opacity="0.7" />
          <rect x="78" y="166" width="8" height="8" fill="#f5c842" opacity="0.3" className="window-blink" style={{ animationDelay: '1.2s' }} />
          <rect x="65" y="184" width="8" height="8" fill="#f5c842" opacity="0.5" />
          <rect x="78" y="184" width="8" height="8" fill="#f5c842" opacity="0.8" />
        </g>

        {/* Building 2 - medium */}
        <g filter="url(#buildShadow)" className="building-2">
          <polygon points="100,210 100,145 125,133 125,198" fill="#1f3d5c" />
          <polygon points="100,145 125,133 150,145 125,157" fill="#2d5a8a" />
          <polygon points="125,157 150,145 150,210 125,222" fill="#152c44" />
          <rect x="105" y="155" width="7" height="7" fill="#60a5fa" opacity="0.7" className="window-blink" style={{ animationDelay: '0.8s' }} />
          <rect x="116" y="155" width="7" height="7" fill="#60a5fa" opacity="0.5" />
          <rect x="105" y="170" width="7" height="7" fill="#60a5fa" opacity="0.9" />
          <rect x="116" y="170" width="7" height="7" fill="#60a5fa" opacity="0.3" className="window-blink" style={{ animationDelay: '2s' }} />
          <rect x="105" y="185" width="7" height="7" fill="#60a5fa" opacity="0.6" />
          <rect x="116" y="185" width="7" height="7" fill="#60a5fa" opacity="0.8" />
        </g>

        {/* Building 3 - short wide */}
        <g filter="url(#buildShadow)">
          <polygon points="20,210 20,165 55,150 55,195" fill="#2e3d2e" />
          <polygon points="20,165 55,150 90,165 55,180" fill="#3a5a3a" />
          <polygon points="55,180 90,165 90,210 55,225" fill="#1a2d1a" />
          <rect x="26" y="172" width="10" height="8" fill="#4ade80" opacity="0.5" />
          <rect x="40" y="172" width="10" height="8" fill="#4ade80" opacity="0.7" className="window-blink" style={{ animationDelay: '1.5s' }} />
          <rect x="26" y="185" width="10" height="8" fill="#4ade80" opacity="0.4" />
          <rect x="40" y="185" width="10" height="8" fill="#4ade80" opacity="0.6" />
        </g>

        {/* Right-side buildings */}
        <g filter="url(#buildShadow)">
          <polygon points="370,210 370,130 400,115 400,195" fill="#2a4a6b" />
          <polygon points="370,130 400,115 430,130 400,145" fill="#3a6090" />
          <polygon points="400,145 430,130 430,210 400,225" fill="#1e3555" />
          <rect x="375" y="140" width="8" height="7" fill="#f5c842" opacity="0.7" className="window-blink" style={{ animationDelay: '0.3s' }} />
          <rect x="387" y="140" width="8" height="7" fill="#f5c842" opacity="0.9" />
          <rect x="375" y="156" width="8" height="7" fill="#f5c842" opacity="0.5" className="window-blink" style={{ animationDelay: '1.8s' }} />
          <rect x="387" y="156" width="8" height="7" fill="#f5c842" opacity="0.3" />
          <rect x="375" y="172" width="8" height="7" fill="#f5c842" opacity="0.8" />
          <rect x="387" y="172" width="8" height="7" fill="#f5c842" opacity="0.6" />
          <rect x="375" y="188" width="8" height="7" fill="#f5c842" opacity="0.4" />
          <rect x="387" y="188" width="8" height="7" fill="#f5c842" opacity="0.9" className="window-blink" style={{ animationDelay: '0.9s' }} />
        </g>

        <g filter="url(#buildShadow)">
          <polygon points="420,210 420,155 450,142 450,198" fill="#1f3d5c" />
          <polygon points="420,155 450,142 480,155 450,168" fill="#2d5a8a" />
          <polygon points="450,168 480,155 480,210 450,223" fill="#152c44" />
          <rect x="425" y="163" width="8" height="7" fill="#60a5fa" opacity="0.6" className="window-blink" style={{ animationDelay: '1.1s' }} />
          <rect x="437" y="163" width="8" height="7" fill="#60a5fa" opacity="0.4" />
          <rect x="425" y="178" width="8" height="7" fill="#60a5fa" opacity="0.8" />
          <rect x="437" y="178" width="8" height="7" fill="#60a5fa" opacity="0.5" className="window-blink" style={{ animationDelay: '2.2s' }} />
          <rect x="425" y="193" width="8" height="7" fill="#60a5fa" opacity="0.3" />
          <rect x="437" y="193" width="8" height="7" fill="#60a5fa" opacity="0.7" />
        </g>

        {/* Antenna on tall building */}
        <line x1="90" y1="105" x2="90" y2="88" stroke="#ccc" strokeWidth="1.5" />
        <circle cx="90" cy="86" r="2.5" fill="#f00" className="antenna-blink" />

        {/* ── Ground ── */}
        <rect x="0" y="258" width="520" height="122" fill="url(#groundGrad)" />

        {/* Road */}
        <rect x="0" y="248" width="520" height="30" fill="url(#roadGrad)" />

        {/* Road markings - dashed center line */}
        <line x1="0" y1="263" x2="520" y2="263" stroke="#f5c842" strokeWidth="1.5" strokeDasharray="18,12" opacity="0.6" className="road-dash" />

        {/* Road edges */}
        <line x1="0" y1="250" x2="520" y2="250" stroke="#555" strokeWidth="1" />
        <line x1="0" y1="276" x2="520" y2="276" stroke="#555" strokeWidth="1" />

        {/* ── Route Map Path (dotted route on ground) ── */}
        <path
          d="M 50,310 Q 130,295 200,305 Q 280,318 360,298 Q 430,285 490,300"
          fill="none"
          stroke="#f5c842"
          strokeWidth="2"
          strokeDasharray="6,5"
          opacity="0.5"
          className="route-path"
        />

        {/* Route dots/pins */}
        <g className="route-pin pin-1">
          <circle cx="80" cy="308" r="6" fill="#f5c842" opacity="0.8" />
          <circle cx="80" cy="308" r="3" fill="#fff" />
          <line x1="80" y1="302" x2="80" y2="290" stroke="#f5c842" strokeWidth="1.5" opacity="0.7" />
        </g>
        <g className="route-pin pin-2" style={{ animationDelay: '0.3s' }}>
          <circle cx="260" cy="306" r="6" fill="#4ade80" opacity="0.8" />
          <circle cx="260" cy="306" r="3" fill="#fff" />
          <line x1="260" y1="300" x2="260" y2="288" stroke="#4ade80" strokeWidth="1.5" opacity="0.7" />
        </g>
        <g className="route-pin pin-3" style={{ animationDelay: '0.6s' }}>
          <circle cx="450" cy="297" r="6" fill="#60a5fa" opacity="0.8" />
          <circle cx="450" cy="297" r="3" fill="#fff" />
          <line x1="450" y1="291" x2="450" y2="279" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* ── Van (large, yellow, moving left to right) ── */}
        <g className="van-vehicle" filter="url(#shadow)">
          {/* Van body */}
          <rect x="0" y="0" width="80" height="42" rx="4" fill="url(#vanGrad)" />
          {/* Cab */}
          <rect x="52" y="-16" width="28" height="20" rx="3" fill="#d4a820" />
          {/* Windshield */}
          <rect x="55" y="-13" width="20" height="14" rx="2" fill="#9dd4f0" opacity="0.85" />
          {/* Side window */}
          <rect x="6" y="4" width="30" height="20" rx="2" fill="#9dd4f0" opacity="0.6" />
          {/* Brand logo on van */}
          <rect x="10" y="8" width="22" height="12" rx="2" fill="#1a472a" opacity="0.85" />
          <text x="21" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">Gifts</text>
          {/* Package outline on van */}
          <rect x="36" y="6" width="14" height="12" rx="1" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />
          <line x1="36" y1="12" x2="50" y2="12" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
          {/* Van door line */}
          <line x1="50" y1="0" x2="50" y2="42" stroke="#c49018" strokeWidth="1" opacity="0.6" />
          {/* Wheels */}
          <circle cx="15" cy="44" r="10" fill="#222" />
          <circle cx="15" cy="44" r="6" fill="#555" />
          <circle cx="15" cy="44" r="3" fill="#888" />
          <circle cx="65" cy="44" r="10" fill="#222" />
          <circle cx="65" cy="44" r="6" fill="#555" />
          <circle cx="65" cy="44" r="3" fill="#888" />
          {/* Headlight */}
          <rect x="76" y="8" width="6" height="8" rx="2" fill="#fff9c4" />
          <ellipse cx="100" cy="12" rx="30" ry="8" fill="url(#headlight)" opacity="0.3" />
          {/* Tail lights */}
          <rect x="0" y="8" width="4" height="6" rx="1" fill="#ef4444" />
          <rect x="0" y="16" width="4" height="6" rx="1" fill="#f97316" />
        </g>

        {/* ── Scooter (green, faster) ── */}
        <g className="scooter-vehicle" filter="url(#shadow)">
          {/* Body */}
          <ellipse cx="20" cy="8" rx="18" ry="10" fill="url(#scooterGrad)" />
          {/* Seat */}
          <ellipse cx="18" cy="2" rx="8" ry="4" fill="#1a472a" />
          {/* Handlebar */}
          <rect x="30" y="-2" width="12" height="3" rx="1.5" fill="#333" />
          <rect x="28" y="-4" width="4" height="8" rx="2" fill="#555" />
          {/* Rider helmet */}
          <circle cx="32" cy="-10" r="8" fill="#f5c842" />
          <circle cx="32" cy="-10" r="5" fill="#d4a820" opacity="0.8" />
          {/* Delivery box on back */}
          <rect x="2" y="-2" width="12" height="10" rx="2" fill="#1a472a" />
          <text x="8" y="6" textAnchor="middle" fill="#4ade80" fontSize="5" fontWeight="bold">📦</text>
          {/* Wheels */}
          <circle cx="5" cy="18" r="8" fill="#222" />
          <circle cx="5" cy="18" r="5" fill="#444" />
          <circle cx="5" cy="18" r="2" fill="#777" />
          <circle cx="36" cy="18" r="8" fill="#222" />
          <circle cx="36" cy="18" r="5" fill="#444" />
          <circle cx="36" cy="18" r="2" fill="#777" />
        </g>

        {/* ── Bike (blue, fastest) ── */}
        <g className="bike-vehicle" filter="url(#shadow)">
          {/* Frame */}
          <line x1="12" y1="20" x2="26" y2="5" stroke="url(#bikeGrad)" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="5" x2="38" y2="20" stroke="url(#bikeGrad)" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="5" x2="20" y2="20" stroke="url(#bikeGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="26" y1="5" x2="32" y2="20" stroke="url(#bikeGrad)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Seat */}
          <rect x="20" y="1" width="12" height="3" rx="1.5" fill="#1e3a5f" />
          {/* Handlebar */}
          <rect x="34" y="0" width="10" height="2" rx="1" fill="#1e3a5f" />
          <rect x="35" y="-2" width="3" height="7" rx="1.5" fill="#2563eb" />
          {/* Rider */}
          <circle cx="38" cy="-8" r="6" fill="#60a5fa" />
          <circle cx="38" cy="-8" r="4" fill="#2563eb" opacity="0.8" />
          {/* Small basket */}
          <rect x="8" y="10" width="8" height="6" rx="1" fill="#1e3a5f" />
          {/* Wheels */}
          <circle cx="12" cy="22" r="9" fill="none" stroke="#2563eb" strokeWidth="2.5" />
          <circle cx="12" cy="22" r="4" fill="#1e3a5f" />
          <circle cx="12" cy="22" r="2" fill="#60a5fa" />
          <circle cx="38" cy="22" r="9" fill="none" stroke="#2563eb" strokeWidth="2.5" />
          <circle cx="38" cy="22" r="4" fill="#1e3a5f" />
          <circle cx="38" cy="22" r="2" fill="#60a5fa" />
        </g>

        {/* ── Speed lines behind vehicles ── */}
        <g className="speed-lines" opacity="0.5">
          <line x1="0" y1="258" x2="40" y2="258" stroke="#f5c842" strokeWidth="1.5" />
          <line x1="0" y1="254" x2="25" y2="254" stroke="#f5c842" strokeWidth="1" />
          <line x1="0" y1="262" x2="30" y2="262" stroke="#f5c842" strokeWidth="0.8" />
        </g>

        {/* ── Floating Package Icons ── */}
        <g className="float-pkg pkg-1">
          <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#f5c842" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#d4a820" strokeWidth="1.5" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#d4a820" strokeWidth="1.5" />
        </g>

        <g className="float-pkg pkg-2" style={{ animationDelay: '1.2s' }}>
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#4ade80" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#16a34a" strokeWidth="1" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#16a34a" strokeWidth="1" />
        </g>

        <g className="float-pkg pkg-3" style={{ animationDelay: '2.4s' }}>
          <rect x="-7" y="-7" width="14" height="14" rx="2.5" fill="#60a5fa" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="#2563eb" strokeWidth="1.2" />
          <line x1="0" y1="-7" x2="0" y2="7" stroke="#2563eb" strokeWidth="1.2" />
        </g>

        {/* ── Decorative circles/orbits ── */}
        <circle cx="260" cy="140" r="80" fill="none" stroke="#f5c842" strokeWidth="0.5" strokeDasharray="4,6" opacity="0.2" className="orbit-ring" />
        <circle cx="260" cy="140" r="110" fill="none" stroke="#4ade80" strokeWidth="0.5" strokeDasharray="3,8" opacity="0.15" className="orbit-ring-2" />
      </svg>
    </div>
  )
}
