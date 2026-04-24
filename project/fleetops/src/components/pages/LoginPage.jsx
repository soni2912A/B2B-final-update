
import React, { useState, useEffect } from 'react'
import { useApp } from '../../AppContext.jsx'
import { apiLogin, setLoginRole } from '../../utils/api.js'
import { showToast } from '../ui/index.jsx'
import DeliveryAnimation from './DeliveryAnimation.jsx'

const ROLES = [
  { id: 'admin', icon: '🏢', label: 'Admin', color: '#f5c842' },
  { id: 'staff', icon: '👤', label: 'Staff', color: '#4ade80' },
  { id: 'corporate_user', icon: '🏭', label: 'Corporate', color: '#60a5fa' },
  { id: 'super_admin', icon: '⚙️', label: 'Super Admin', color: '#f472b6' },
]

export default function LoginPage() {
  const { login, showRegister, showForgot, showAdminRegister } = useApp()
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('admin@acme.com')
  const [password, setPassword] = useState('Admin@1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const activeRole = ROLES.find(r => r.id === role)

  async function doLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    setLoginRole(role)
    try {
      const res = await apiLogin(email, password)
      const tok = res.data?.token ?? res.token
      const user = res.data?.user ?? res.user
      if (!tok || !user) {
        setError(res.message || 'Unexpected response from server')
      } else {
        login(tok, user)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: #060d1a;
          font-family: 'DM Sans', system-ui, sans-serif;
          overflow: hidden;
          position: relative;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(245,200,66,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,200,66,0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
          z-index: 0;
        }
        @keyframes gridMove {
          0%   { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        .ambient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: blobPulse 8s ease-in-out infinite;
        }
        .blob-yellow {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(245,200,66,0.18) 0%, transparent 70%);
          top: -100px; left: -80px;
        }
        .blob-green {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%);
          bottom: 50px; right: -60px;
          animation-delay: 3s;
        }
        .blob-blue {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%);
          top: 50%; left: 40%;
          animation-delay: 1.5s;
        }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }
        .login-right {
          width: 430px;
          min-height: 100vh;
          background: rgba(8,16,30,0.9);
          backdrop-filter: blur(24px);
          border-left: 1px solid rgba(245,200,66,0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem 2.5rem;
          position: relative;
          z-index: 2;
          box-shadow: -20px 0 60px rgba(0,0,0,0.5);
        }
        .anim-panel { width: 100%; max-width: 580px; }
        .hero-headline {
          color: #fff;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 0.9rem;
        }
        .accent-yellow { color: #f5c842; }
        .accent-green  { color: #4ade80; }
        .hero-sub {
          color: rgba(255,255,255,0.45);
          font-size: 0.92rem;
          line-height: 1.65;
          max-width: 400px;
          margin-bottom: 1.5rem;
        }
        .stat-chips { display: flex; gap: 0.65rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .stat-chip {
          display: flex; align-items: center; gap: 0.45rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 0.35rem 0.9rem;
          color: rgba(255,255,255,0.65);
          font-size: 0.76rem;
          white-space: nowrap;
        }
        .chip-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          animation: chipPulse 2s ease-in-out infinite;
        }
        @keyframes chipPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
        .delivery-scene {
          width: 100%; height: 210px;
          position: relative; margin: 0.5rem 0 1.5rem;
          overflow: hidden; border-radius: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        /* Vehicle animations */
        .van-vehicle {
          animation: driveVan 10s linear infinite;
          transform: translateX(-120px) translateY(204px);
        }
        @keyframes driveVan {
          0%   { transform: translateX(-120px) translateY(204px); }
          100% { transform: translateX(560px)  translateY(204px); }
        }
        .scooter-vehicle {
          animation: driveScooter 7s linear infinite;
          animation-delay: 2s;
          transform: translateX(-70px) translateY(216px);
        }
        @keyframes driveScooter {
          0%   { transform: translateX(-70px)  translateY(216px); }
          100% { transform: translateX(560px)  translateY(216px); }
        }
        .bike-vehicle {
          animation: driveBike 5s linear infinite;
          animation-delay: 4s;
          transform: translateX(-60px) translateY(218px);
        }
        @keyframes driveBike {
          0%   { transform: translateX(-60px)  translateY(218px); }
          100% { transform: translateX(560px)  translateY(218px); }
        }
        .window-blink { animation: windowBlink 4s ease-in-out infinite; }
        @keyframes windowBlink {
          0%, 88%, 100% { opacity: 0.8; }
          91% { opacity: 0.1; }
          94% { opacity: 0.8; }
        }
        .antenna-blink { animation: antBlink 1.2s ease-in-out infinite; }
        @keyframes antBlink { 0%,100%{opacity:1;}50%{opacity:0.1;} }
        .route-path {
          stroke-dasharray: 350;
          stroke-dashoffset: 350;
          animation: drawRoute 3s ease forwards;
        }
        @keyframes drawRoute { to { stroke-dashoffset: 0; } }
        .route-pin { animation: pinBounce 2s ease-in-out infinite; transform-origin: center bottom; }
        @keyframes pinBounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
        .pkg-1 { animation: floatPkg1 3s ease-in-out infinite; }
        .pkg-2 { animation: floatPkg2 3s ease-in-out infinite; animation-delay:1s; }
        .pkg-3 { animation: floatPkg3 3s ease-in-out infinite; animation-delay:2s; }
        @keyframes floatPkg1 {
          0%,100%{transform:translate(140px,288px) rotate(0deg);}
          50%{transform:translate(140px,280px) rotate(8deg);}
        }
        @keyframes floatPkg2 {
          0%,100%{transform:translate(290px,294px) rotate(0deg);}
          50%{transform:translate(290px,286px) rotate(-7deg);}
        }
        @keyframes floatPkg3 {
          0%,100%{transform:translate(415px,284px) rotate(0deg);}
          50%{transform:translate(415px,276px) rotate(10deg);}
        }
        .orbit-ring  { animation: orbitSpin 22s linear infinite; transform-origin: 260px 130px; }
        .orbit-ring-2 { animation: orbitSpin 35s linear infinite reverse; transform-origin: 260px 130px; }
        @keyframes orbitSpin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }

        /* Stats row */
        .stats-row { display: flex; gap: 2.5rem; margin-top: 0.5rem; }
        .stat-item {}
        .stat-val { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.03em; }
        .stat-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.1rem; }

        /* Form card */
        .form-card {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .form-card.mounted { opacity: 1; transform: translateY(0); }
        .brand-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.25rem; }
        .brand-icon {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, #f5c842, #c49018);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: #1a1917; font-weight: 900;
          box-shadow: 0 4px 20px rgba(245,200,66,0.45);
          flex-shrink: 0;
        }
        .brand-name { font-size: 1.3rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .brand-tag  { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; }
        .signin-heading { font-size: 1.55rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; letter-spacing: -0.02em; }
        .signin-sub { font-size: 0.82rem; color: rgba(255,255,255,0.38); margin-bottom: 1.6rem; }

        /* Role grid */
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1.4rem; }
        .role-btn {
          padding: 0.7rem 0.5rem; border-radius: 11px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          cursor: pointer; text-align: center;
          transition: all 0.2s ease; position: relative; overflow: hidden;
        }
        .role-btn:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.07); }
        .role-btn.active {
          border-color: var(--rc);
          background: color-mix(in srgb, var(--rc) 14%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc) 25%, transparent),
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .role-icon { font-size: 1.25rem; margin-bottom: 0.22rem; }
        .role-label { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.05em; }
        .role-btn.active .role-label { color: var(--rc); }

        .role-indicator { height: 2px; border-radius: 2px; margin-bottom: 1.4rem; transition: background 0.3s ease; }

        /* Inputs */
        .form-group-dark { margin-bottom: 1rem; }
        .dark-label { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.05em; text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
        .dark-input {
          width: 100%; background: rgba(255,255,255,0.06) !important;
          border: 1.5px solid rgba(255,255,255,0.11) !important;
          border-radius: 11px !important; color: #fff !important;
          padding: 0.68rem 1rem !important; font-size: 0.88rem !important;
          transition: all 0.2s ease !important; outline: none !important;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .dark-input::placeholder { color: rgba(255,255,255,0.25) !important; }
        .dark-input:focus {
          border-color: var(--rc) !important;
          background: rgba(255,255,255,0.09) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--rc) 18%, transparent) !important;
        }

        /* Submit */
        .submit-btn {
          width: 100%; height: 50px;
          background: linear-gradient(135deg, var(--rc) 0%, color-mix(in srgb, var(--rc) 65%, #000) 100%);
          color: #1a1917; border: none; border-radius: 13px;
          font-size: 0.9rem; font-weight: 700; cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.25s ease;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          margin-top: 1.3rem;
          box-shadow: 0 4px 22px color-mix(in srgb, var(--rc) 38%, transparent);
          position: relative; overflow: hidden;
        }
        .submit-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px color-mix(in srgb, var(--rc) 48%, transparent); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .dark-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(26,25,23,0.3);
          border-top-color: #1a1917;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-box {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.28);
          border-radius: 10px; padding: 0.65rem 1rem;
          font-size: 0.81rem; color: #fca5a5; margin-bottom: 1rem;
        }

        .form-footer {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 1.3rem; padding-top: 1.3rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .forgot-link {
          font-size: 0.8rem; color: var(--rc); text-decoration: none; opacity: 0.8; transition: opacity 0.2s;
        }
        .forgot-link:hover { opacity: 1; text-decoration: underline; }
        .api-tag { font-size: 0.7rem; color: rgba(255,255,255,0.2); font-family: 'DM Mono', monospace; }

        .register-row {
          display: flex; justify-content: center; align-items: center; gap: 0.4rem;
          margin-top: 1rem; font-size: 0.82rem; color: rgba(255,255,255,0.35);
        }
        .register-link {
          color: var(--rc); cursor: pointer; font-weight: 600; background: none;
          border: none; padding: 0; font-size: inherit; font-family: inherit;
          transition: opacity 0.2s;
        }
        .register-link:hover { opacity: 0.8; text-decoration: underline; }

        /* Responsive */
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; min-height: 100vh; border-left: none; padding: 2.5rem 1.75rem; }
          .mobile-brand { display: flex !important; }
        }
        @media (min-width: 769px) { .mobile-brand { display: none !important; } }
        @media (max-width: 420px) {
          .login-right { padding: 1.5rem 1rem; }
          .brand-icon { width: 38px; height: 38px; font-size: 1.2rem; border-radius: 10px; }
          .brand-name { font-size: 1.1rem; }
          .signin-heading { font-size: 1.2rem; }
          .signin-sub { font-size: 0.78rem; margin-bottom: 1rem; }
          .role-grid { gap: 0.5rem; margin-bottom: 1rem; }
          .role-btn { padding: 0.6rem 0.4rem; }
          .role-icon { font-size: 1.1rem; }
          .role-label { font-size: 0.62rem; letter-spacing: 0.04em; }
          .submit-btn { height: 48px; font-size: 0.85rem; }
          .dark-input { padding: 0.7rem 0.85rem !important; font-size: 0.9rem !important; min-height: 44px; }
          .form-footer { flex-wrap: wrap; gap: 0.5rem; }
          .api-tag { display: none; }
          .register-row { font-size: 0.78rem; }
        }
        @media (max-width: 340px) {
          .login-right { padding: 1.25rem 0.75rem; }
          .role-grid { grid-template-columns: 1fr 1fr; gap: 0.4rem; }
          .brand-name { font-size: 1rem; }
          .role-label { font-size: 0.58rem; }
        }
        @media (min-width: 769px) and (max-width: 1024px) { .login-right { width: 390px; padding: 2rem 2rem; } }
      `}</style>

      <div className="login-page">
        <div className="ambient-blob blob-yellow" />
        <div className="ambient-blob blob-green" />
        <div className="ambient-blob blob-blue" />

        {/* LEFT panel */}
        <div className="login-left">
          <div className="anim-panel">
            <h1 className="hero-headline">
              Deliver <span className="accent-yellow">faster.</span><br />
              Manage <span className="accent-green">smarter.</span>
            </h1>
            <p className="hero-sub">
              Real-time fleet tracking, smart dispatching, and intelligent route optimization — all in one platform.
            </p>
            <div className="stat-chips">
              {[
                { label: 'Live Tracking', color: '#f5c842' },
                { label: 'Smart Routes', color: '#4ade80', delay: '0.6s' },
                { label: 'Analytics', color: '#60a5fa', delay: '1.2s' },
              ].map(c => (
                <div key={c.label} className="stat-chip">
                  <span className="chip-dot" style={{ background: c.color, animationDelay: c.delay }} />
                  {c.label}
                </div>
              ))}
            </div>

            {/* SVG Scene */}
            <DeliveryAnimation />

            <div className="stats-row">
              {[
                { value: '12.4K', label: 'Deliveries Today', color: '#f5c842' },
                { value: '98.2%', label: 'On-time Rate', color: '#4ade80' },
                { value: '340', label: 'Active Drivers', color: '#60a5fa' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT panel */}
        <div className="login-right" style={{ '--rc': activeRole?.color }}>
          {/* Mobile brand */}
          <div className="mobile-brand" style={{ display: 'none', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div className="brand-icon">🎁</div>
            <div>
              <div className="brand-name">B2B Bakery</div>
              <div className="brand-tag">B2B Corporate Bakery Platform</div>
            </div>
          </div>

          <div className={`form-card ${mounted ? 'mounted' : ''}`}>
            <div className="brand-logo">
              <div className="brand-icon">🎁</div>
              <div>
                <div className="brand-name">B2B Bakery</div>
                <div className="brand-tag">B2B Corporate Bakery Platform</div>
              </div>
            </div>

            <h2 className="signin-heading">Welcome back</h2>
            <p className="signin-sub">Log in to your dashboard</p>

            <div className="role-grid">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`role-btn ${role === r.id ? 'active' : ''}`}
                  style={{ '--rc': r.color }}
                >
                  <div className="role-icon">{r.icon}</div>
                  <div className="role-label">{r.label}</div>
                </button>
              ))}
            </div>

            <div className="role-indicator" style={{ background: `linear-gradient(90deg, ${activeRole?.color}, transparent)` }} />

            {error && <div className="error-box">⚠ {error}</div>}

            <form onSubmit={doLogin}>
              <div className="form-group-dark">
                <label className="dark-label">Email ID</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="dark-input" style={{ '--rc': activeRole?.color }}
                />
              </div>
              <div className="form-group-dark">
                <label className="dark-label">Password</label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="dark-input" style={{ '--rc': activeRole?.color }}
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn" style={{ '--rc': activeRole?.color }}>
                {loading
                  ? <><div className="dark-spinner" /> Login in…</>
                  : <>Login as {activeRole?.label} →</>
                }
              </button>
            </form>

            <div className="form-footer">
              <a
                href="#" className="forgot-link" style={{ '--rc': activeRole?.color }}
                onClick={e => { e.preventDefault(); showForgot() }}
              >
                Forgot password?
              </a>
              <span className="api-tag">localhost:5000/api/v1</span>
            </div>

            <div className="register-row" style={{ '--rc': activeRole?.color }}>
              New corporate client?
              <button className="register-link" onClick={showRegister}>Create an account</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}