import React, { useState, useEffect } from 'react'
import { useApp } from '../../AppContext.jsx'
import { apiRegister, apiFetch, formatCurrency } from '../../utils/api.js'
import DeliveryAnimation from './DeliveryAnimation.jsx'

export default function RegisterPage() {
  const { showLogin, showAdminRegister } = useApp()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)

  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  // Coupon code
  const [couponInput, setCouponInput]     = useState('')
  const [couponResult, setCouponResult]   = useState(null)
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // ── CHANGE 2: referralCode added (removed duplicate referralcode) ──
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    countryCode: '+91',
    referralCode: '',   // ← single, correct camelCase field
  })

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (step !== 2) return
    setPlansLoading(true)
    apiFetch('GET', '/auth/plans')
      .then(res => setPlans(res.data?.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }, [step])

  // ── CHANGE 1: Read ?ref= from URL and pre-fill referral code ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }))
      // Tell backend this link was opened (increments click counter)
      fetch('/api/v1/public/referrals/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref, businessId: '' }),
      }).catch(() => {})
    }
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const CC_CONFIG = {
    '+91':  { max: 10, placeholder: '98765 43210',   flag: '🇮🇳', label: 'India' },
    '+1':   { max: 10, placeholder: '555 000 1234',  flag: '🇺🇸', label: 'USA/Canada' },
    '+44':  { max: 10, placeholder: '7911 123456',   flag: '🇬🇧', label: 'UK' },
    '+61':  { max: 9,  placeholder: '412 345 678',   flag: '🇦🇺', label: 'Australia' },
    '+971': { max: 9,  placeholder: '50 123 4567',   flag: '🇦🇪', label: 'UAE' },
    '+65':  { max: 8,  placeholder: '8123 4567',     flag: '🇸🇬', label: 'Singapore' },
    '+49':  { max: 10, placeholder: '1511 2345678',  flag: '🇩🇪', label: 'Germany' },
    '+33':  { max: 9,  placeholder: '6 12 34 56 78', flag: '🇫🇷', label: 'France' },
    '+81':  { max: 10, placeholder: '90 1234 5678',  flag: '🇯🇵', label: 'Japan' },
    '+86':  { max: 11, placeholder: '131 2345 6789', flag: '🇨🇳', label: 'China' },
    '+82':  { max: 10, placeholder: '10 1234 5678',  flag: '🇰🇷', label: 'S. Korea' },
    '+92':  { max: 10, placeholder: '300 1234567',   flag: '🇵🇰', label: 'Pakistan' },
    '+880': { max: 10, placeholder: '1711 123456',   flag: '🇧🇩', label: 'Bangladesh' },
    '+94':  { max: 9,  placeholder: '71 234 5678',   flag: '🇱🇰', label: 'Sri Lanka' },
    '+977': { max: 10, placeholder: '98 1234 5678',  flag: '🇳🇵', label: 'Nepal' },
    '+966': { max: 9,  placeholder: '50 123 4567',   flag: '🇸🇦', label: 'Saudi Arabia' },
    '+974': { max: 8,  placeholder: '3312 3456',     flag: '🇶🇦', label: 'Qatar' },
    '+968': { max: 8,  placeholder: '9123 4567',     flag: '🇴🇲', label: 'Oman' },
    '+973': { max: 8,  placeholder: '3600 1234',     flag: '🇧🇭', label: 'Bahrain' },
    '+60':  { max: 10, placeholder: '12 345 6789',   flag: '🇲🇾', label: 'Malaysia' },
    '+62':  { max: 12, placeholder: '812 3456 7890', flag: '🇮🇩', label: 'Indonesia' },
    '+63':  { max: 10, placeholder: '917 123 4567',  flag: '🇵🇭', label: 'Philippines' },
    '+66':  { max: 9,  placeholder: '81 234 5678',   flag: '🇹🇭', label: 'Thailand' },
    '+27':  { max: 9,  placeholder: '71 234 5678',   flag: '🇿🇦', label: 'South Africa' },
    '+55':  { max: 11, placeholder: '11 91234 5678', flag: '🇧🇷', label: 'Brazil' },
    '+52':  { max: 10, placeholder: '1 234 567 890', flag: '🇲🇽', label: 'Mexico' },
  }

  const currentCc = form.countryCode || '+91'
  const ccConf = CC_CONFIG[currentCc] || CC_CONFIG['+91']
  const phoneDigits = form.phone || ''

  function goToStep2(e) {
    e && e.preventDefault && e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!/^[A-Za-z\s]+$/.test(form.name.trim())) { setError('Name must contain only letters.'); return }
    if (!form.companyName.trim()) { setError('Company name is required.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (phoneDigits.trim()) {
      const digits = phoneDigits.replace(/\D/g, '')
      if (digits.length !== ccConf.max) {
        setError(`Phone number must be exactly ${ccConf.max} digits for ${ccConf.label} (${currentCc}).`)
        return
      }
    }
    if (form.contactPerson && /[0-9]/.test(form.contactPerson)) { setError('Contact person name must not contain numbers.'); return }
    setStep(2)
  }

  // ── CHANGE 3: referralCode correctly spread into apiRegister payload ──
  async function applyCoupon() {
    if (!couponInput.trim()) { setCouponError('Coupon code enter करा.'); return }
    setCouponLoading(true); setCouponError(''); setCouponResult(null)
    try {
      const res = await apiFetch('POST', '/public/coupons/validate', {
        code: couponInput.trim().toUpperCase(),
        planId: selectedPlan?._id,
      })
      setCouponResult(res.data?.coupon)
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code.')
    } finally { setCouponLoading(false) }
  }

  function getDiscountedPrice(plan) {
    if (!couponResult || !plan) return plan?.price || 0
    if (couponResult.type === 'percentage') {
      const disc = (plan.price * couponResult.value) / 100
      const capped = couponResult.maxDiscountAmount ? Math.min(disc, couponResult.maxDiscountAmount) : disc
      return Math.max(0, plan.price - capped)
    }
    return Math.max(0, plan.price - couponResult.value)
  }

  async function doRegister(e) {
    e && e.preventDefault && e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        contactPerson: form.contactPerson || form.name,
        phone: phoneDigits ? `${currentCc} ${phoneDigits}` : '',
        planId: selectedPlan?._id,
        ...(couponResult ? { couponCode: couponResult.code } : {}),
        ...(form.referralCode ? { referralCode: form.referralCode } : {}),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* PAGE SHELL */
        .reg-page {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background: #060d1a;
          font-family: 'DM Sans', system-ui, sans-serif;
          overflow-x: hidden;
          position: relative;
        }
        .reg-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMoveReg 20s linear infinite;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes gridMoveReg {
          0%   { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        .ambient-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; animation: blobPulseReg 8s ease-in-out infinite; }
        .blob-blue-r   { width: 420px; height: 420px; background: radial-gradient(circle, rgba(96,165,250,0.16) 0%, transparent 70%); top: -100px; left: -80px; }
        .blob-purple-r { width: 350px; height: 350px; background: radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%); bottom: 50px; right: -60px; animation-delay: 3s; }
        .blob-cyan-r   { width: 280px; height: 280px; background: radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%); top: 55%; left: 42%; animation-delay: 1.5s; }
        @keyframes blobPulseReg { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.7; } }

        /* LEFT PANEL */
        .reg-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .anim-panel-r { width: 100%; max-width: 580px; }
        .hero-headline-r {
          color: #fff;
          font-size: clamp(1.6rem, 3vw, 2.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 0.9rem;
        }
        .accent-blue { color: #60a5fa; }
        .accent-cyan { color: #22d3ee; }
        .hero-sub-r {
          color: rgba(255,255,255,0.45);
          font-size: 0.92rem;
          line-height: 1.65;
          max-width: 400px;
          margin-bottom: 1.5rem;
        }
        .feature-list { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 2rem; }
        .feature-item {
          display: flex; align-items: center; gap: 0.7rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.82rem;
        }
        .feature-icon { font-size: 1.1rem; flex-shrink: 0; }

        /* RIGHT PANEL */
        .reg-right {
          width: clamp(300px, 42vw, 500px);
          flex-shrink: 0;
          background: rgba(8,16,30,0.9);
          backdrop-filter: blur(24px);
          border-left: 1px solid rgba(96,165,250,0.15);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 2rem 4rem;
          position: relative;
          z-index: 2;
          box-shadow: -20px 0 60px rgba(0,0,0,0.5);
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .reg-card { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .reg-card.mounted { opacity: 1; transform: translateY(0); }

        /* BRAND LOGO */
        .brand-logo-r { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.2rem; }
        .brand-icon-r {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, #60a5fa, #2563eb);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: #fff;
          box-shadow: 0 4px 20px rgba(96,165,250,0.45);
          flex-shrink: 0;
        }
        .brand-name-r { font-size: 1.3rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .brand-tag-r  { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; }

        /* HEADINGS */
        .reg-heading { font-size: 1.35rem; font-weight: 700; color: #fff; margin-bottom: 0.15rem; letter-spacing: -0.02em; }
        .reg-sub     { font-size: 0.8rem; color: rgba(255,255,255,0.38); margin-bottom: 1rem; }
        .reg-section-label {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #60a5fa;
          margin: 0.75rem 0 0.45rem; padding-bottom: 0.3rem;
          border-bottom: 1px solid rgba(96,165,250,0.15);
        }

        /* FORM */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
        .form-group-r { margin-bottom: 0.6rem; }

        .dark-label-r {
          font-size: 0.7rem; font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.05em; text-transform: uppercase;
          display: block; margin-bottom: 0.3rem;
        }
        .dark-input-r,
        .dark-select-r {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.11);
          border-radius: 10px;
          color: #fff;
          font-size: 0.85rem;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: all 0.2s ease;
          outline: none;
          min-height: 42px;
        }
        input.dark-input-r { padding: 0.55rem 0.85rem; line-height: normal; }
        .dark-input-r::placeholder { color: rgba(255,255,255,0.22); }
        .dark-input-r:focus,
        .dark-select-r:focus {
          border-color: #60a5fa;
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 3px rgba(96,165,250,0.18);
        }
        .dark-select-r {
          appearance: none; -webkit-appearance: none;
          padding: 0.55rem 2rem 0.55rem 0.85rem;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem center;
        }
        .dark-select-r option { background: #0f1c2e; color: #fff; }

        /* PHONE */
        .phone-wrap { display: flex; gap: 7px; align-items: stretch; width: 100%; }
        .phone-cc-select { flex: 0 0 auto; width: 105px; min-width: 80px; }
        .phone-number-input { flex: 1 1 0; min-width: 0; }
        .phone-hint { font-size: 0.67rem; color: rgba(255,255,255,0.3); margin-top: 0.25rem; }

        /* REFERRAL */
        .referral-input { text-transform: uppercase; letter-spacing: 0.1em; }
        .referral-input::placeholder { text-transform: none; letter-spacing: normal; }

        /* PASSWORD STRENGTH */
        .pw-strength { height: 3px; border-radius: 3px; margin-top: 0.3rem; background: rgba(255,255,255,0.08); overflow: hidden; }
        .pw-strength-bar { height: 100%; border-radius: 3px; transition: width 0.3s, background 0.3s; }

        /* BUTTON */
        .reg-btn {
          width: 100%; height: 46px;
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 0.88rem; font-weight: 700; cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.25s ease;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          margin-top: 1rem;
          box-shadow: 0 4px 22px rgba(96,165,250,0.38);
          position: relative; overflow: hidden;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .reg-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.18), transparent); opacity: 0; transition: opacity 0.2s; }
        .reg-btn:hover::before { opacity: 1; }
        .reg-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(96,165,250,0.48); }
        .reg-btn:active { transform: translateY(0); }
        .reg-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .dark-spinner-r { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spinR 0.6s linear infinite; flex-shrink: 0; }
        @keyframes spinR { to { transform: rotate(360deg); } }

        /* MESSAGES */
        .error-box-r { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.28); border-radius: 10px; padding: 0.55rem 0.85rem; font-size: 0.78rem; color: #fca5a5; margin-bottom: 0.75rem; word-break: break-word; }
        .success-box { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 14px; padding: 2rem 1.5rem; text-align: center; }
        .success-icon  { font-size: 3rem; margin-bottom: 0.75rem; }
        .success-title { font-size: 1.2rem; font-weight: 700; color: #4ade80; margin-bottom: 0.5rem; }
        .success-msg   { font-size: 0.84rem; color: rgba(255,255,255,0.55); line-height: 1.6; word-break: break-word; }

        .login-link-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.4rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.07); font-size: 0.82rem; color: rgba(255,255,255,0.35); }
        .login-link { color: #60a5fa; cursor: pointer; text-decoration: none; font-weight: 600; transition: opacity 0.2s; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
        .login-link:hover { opacity: 0.8; text-decoration: underline; }

        /* PLAN CARDS */
        .plan-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .plan-card {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 12px 14px; text-align: left; cursor: pointer;
          color: #fff; transition: all 0.15s; width: 100%;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .plan-card.selected { background: rgba(96,165,250,0.15); border-color: #60a5fa; }
        .plan-card-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .plan-name  { font-weight: 600; font-size: 14px; }
        .plan-desc  { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        .plan-price { font-weight: 700; font-size: 15px; color: #60a5fa; white-space: nowrap; }
        .plan-cycle { font-size: 11px; color: rgba(255,255,255,0.4); text-align: right; }
        .plan-selected-badge { margin-top: 6px; font-size: 12px; color: #60a5fa; }

        /* ══ RESPONSIVE ══ */

        /* Shrink form-row to single col when panel gets narrow */
        @media (max-width: 1100px) {
          .form-row { grid-template-columns: 1fr; }
          .reg-right { width: clamp(280px, 45vw, 440px); }
        }

        /* Tablet: hide left, full-width right */
        @media (max-width: 768px) {
          .reg-page { flex-direction: column; }
          .reg-left { display: none; }
          .reg-right {
            width: 100% !important;
            min-height: 100vh;
            border-left: none;
            padding: 1.2rem 1.25rem 4rem;
            box-shadow: none;
          }
          .form-row { grid-template-columns: 1fr !important; }
          .phone-cc-select { width: 105px; }
        }

        /* Small mobile */
        @media (max-width: 480px) {
          .reg-right { padding: 1rem 1rem 4rem !important; }
          .dark-input-r, .dark-select-r { font-size: 16px !important; min-height: 44px; }
          input.dark-input-r { padding: 0.65rem 0.75rem !important; }
          .dark-select-r { padding: 0.65rem 1.8rem 0.65rem 0.65rem !important; }
          .phone-cc-select { width: 92px; min-width: 78px; }
          .phone-wrap { gap: 5px; }
          .reg-btn { height: 46px; font-size: 0.84rem; }
          .brand-icon-r { width: 40px; height: 40px; font-size: 1.2rem; border-radius: 10px; }
          .brand-name-r { font-size: 1.1rem; }
          .reg-heading { font-size: 1.15rem; }
          .success-box { padding: 1.5rem 1rem; }
        }

        /* Extra small */
        @media (max-width: 360px) {
          .reg-right { padding: 0.9rem 0.75rem 3.5rem !important; }
          .phone-cc-select { width: 80px; min-width: 70px; }
          .brand-name-r { font-size: 1rem; }
          .reg-heading { font-size: 1.05rem; }
        }
      `}</style>

      <div className="reg-page">
        <div className="ambient-blob blob-blue-r" />
        <div className="ambient-blob blob-purple-r" />
        <div className="ambient-blob blob-cyan-r" />

        {/* ── LEFT PANEL ── */}
        <div className="reg-left">
          <div className="anim-panel-r">
            <h1 className="hero-headline-r">
              Join <span className="accent-blue">B2B Corporate Bakery Platform.</span><br />
              Scale <span className="accent-cyan">smarter.</span>
            </h1>
            <p className="hero-sub-r">
              Register your corporate account and get instant access to powerful gifting and delivery management tools.
            </p>

            <div className="feature-list">
              {[
                { icon: '📦', text: 'Place and track orders in real-time' },
                { icon: '🚚', text: 'Live delivery tracking for your team' },
                { icon: '📊', text: 'Analytics dashboard and reports' },
                { icon: '🧾', text: 'Automated invoicing and payment tracking' },
                { icon: '👥', text: 'Manage your corporate team and staff' },
              ].map(f => (
                <div key={f.text} className="feature-item">
                  <span className="feature-icon">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>

            <DeliveryAnimation />
          </div>
        </div>

        {/* ── RIGHT PANEL (form card) ── */}
        <div className="reg-right">
          <div className={`reg-card ${mounted ? 'mounted' : ''}`}>

            {/* Brand */}
            <div className="brand-logo-r">
              <div className="brand-icon-r">🎁</div>
              <div>
                <div className="brand-name-r">B2B Bakery</div>
                <div className="brand-tag-r">Corporate Registration</div>
              </div>
            </div>

            <h2 className="reg-heading">Create your account</h2>
            <p className="reg-sub">Set up your corporate access in minutes</p>

            {success ? (
              <div className="success-box">
                <div className="success-icon">✅</div>
                <div className="success-title">Registration Successful!</div>
                <p className="success-msg">
                  We've sent a verification email to{' '}
                  <strong style={{ color: '#4ade80' }}>{form.email}</strong>.
                  Please check your inbox and click the link to activate your account.
                </p>
                <button
                  className="reg-btn"
                  style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)' }}
                  onClick={showLogin}
                >
                  Back to Sign In →
                </button>
              </div>
            ) : (
              <>
                {error && <div className="error-box-r">⚠ {error}</div>}

                {/* ══ STEP 1 ══ */}
                {step === 1 ? (
                  <form onSubmit={goToStep2} noValidate>
                    <div className="reg-section-label">Your details</div>

                    {/* Name + Phone */}
                    <div className="form-row">
                      <div className="form-group-r">
                        <label className="dark-label-r">Full Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('name')(e) }}
                          placeholder="Full Name"
                          required
                          className="dark-input-r"
                          autoComplete="name"
                        />
                      </div>

                      <div className="form-group-r">
                        <label className="dark-label-r">Contact Number</label>
                        <div className="phone-wrap">
                          <select
                            value={currentCc}
                            onChange={e => setForm(f => ({ ...f, countryCode: e.target.value, phone: '' }))}
                            className="dark-select-r phone-cc-select"
                            aria-label="Country code"
                          >
                            {Object.entries(CC_CONFIG).map(([code, cfg]) => (
                              <option key={code} value={code}>
                                {cfg.flag} {code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={phoneDigits}
                            onChange={e => {
                              const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, ccConf.max)
                              setForm(f => ({ ...f, phone: raw }))
                            }}
                            placeholder={ccConf.placeholder}
                            className="dark-input-r phone-number-input"
                            maxLength={ccConf.max}
                            inputMode="numeric"
                            autoComplete="tel-national"
                          />
                        </div>
                        <div className="phone-hint">{ccConf.label}: {ccConf.max} digits</div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="form-group-r">
                      <label className="dark-label-r">Email ID *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="you@company.com"
                        required
                        className="dark-input-r"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password row */}
                    <div className="form-row">
                      <div className="form-group-r">
                        <label className="dark-label-r">Password *</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={set('password')}
                          placeholder="Min. 6 characters"
                          required
                          className="dark-input-r"
                          autoComplete="new-password"
                        />
                        <div className="pw-strength">
                          <div className="pw-strength-bar" style={{
                            width: form.password.length === 0 ? '0%' : form.password.length < 6 ? '30%' : form.password.length < 10 ? '65%' : '100%',
                            background: form.password.length === 0 ? 'transparent' : form.password.length < 6 ? '#ef4444' : form.password.length < 10 ? '#f59e0b' : '#4ade80',
                          }} />
                        </div>
                      </div>
                      <div className="form-group-r">
                        <label className="dark-label-r">Confirm Password *</label>
                        <input
                          type="password"
                          value={form.confirmPassword}
                          onChange={set('confirmPassword')}
                          placeholder="••••••••"
                          required
                          className="dark-input-r"
                          autoComplete="new-password"
                          style={{ borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#ef4444' : undefined }}
                        />
                      </div>
                    </div>

                    <div className="reg-section-label">Company details</div>

                    <div className="form-group-r">
                      <label className="dark-label-r">Company Name *</label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={set('companyName')}
                        placeholder="Acme Corp Ltd"
                        required
                        className="dark-input-r"
                        autoComplete="organization"
                      />
                    </div>

                    <div className="form-group-r">
                      <label className="dark-label-r">Contact Person</label>
                      <input
                        type="text"
                        value={form.contactPerson}
                        onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('contactPerson')(e) }}
                        placeholder="Primary contact name"
                        className="dark-input-r"
                        autoComplete="name"
                      />
                    </div>

                    {/* ── CHANGE 4: Referral Code field ── */}
                    <div className="form-group-r">
                      <label className="dark-label-r">
                        Referral Code{' '}
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={form.referralCode}
                        onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. A3F7C12B"
                        maxLength={16}
                        className="dark-input-r referral-input"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>

                    <button type="submit" className="reg-btn">Next: Select Plan →</button>

                    <div className="login-link-row">
                      Already have an account?
                      <button type="button" className="login-link" onClick={showLogin}>Sign in</button>
                    </div>
                  </form>

                ) : (
                  /* ══ STEP 2 ══ */
                  <div>
                    <div className="reg-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError('') }}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '13px', padding: 0, fontFamily: 'inherit' }}
                      >
                        ← Back
                      </button>
                      Select a Subscription Plan
                    </div>

                    {plansLoading ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)' }}>
                        Loading plans…
                      </div>
                    ) : plans.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                        No plans available — you can proceed without selecting one.
                      </div>
                    ) : (
                      <div className="plan-list">
                        {plans.map(plan => (
                          <button
                            key={plan._id}
                            type="button"
                            className={`plan-card${selectedPlan?._id === plan._id ? ' selected' : ''}`}
                            onClick={() => setSelectedPlan(selectedPlan?._id === plan._id ? null : plan)}
                          >
                            <div className="plan-card-row">
                              <div>
                                <div className="plan-name">{plan.name}</div>
                                {plan.description && <div className="plan-desc">{plan.description}</div>}
                              </div>
                              <div>
                                <div className="plan-price">
                                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                                </div>
                                {plan.billingCycle && <div className="plan-cycle">{plan.billingCycle}</div>}
                              </div>
                            </div>
                            {selectedPlan?._id === plan._id && (
                              <div className="plan-selected-badge">✓ Selected</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ── Coupon Code ── */}
                    {selectedPlan && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>🏷️ Coupon Code</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponResult(null); setCouponError('') }}
                            placeholder="COUPON CODE"
                            className="dark-input-r"
                            style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            style={{
                              padding: '0 16px', borderRadius: 10, border: '1.5px solid #60a5fa',
                              background: 'transparent', color: '#60a5fa', fontSize: 13, fontWeight: 600,
                              cursor: couponLoading || !couponInput.trim() ? 'not-allowed' : 'pointer',
                              opacity: couponLoading || !couponInput.trim() ? 0.5 : 1,
                              fontFamily: 'DM Sans, system-ui, sans-serif',
                            }}
                          >
                            {couponLoading ? '…' : 'Apply'}
                          </button>
                        </div>
                        {couponError && <div style={{ marginTop: 6, fontSize: 12, color: '#fca5a5' }}>⚠ {couponError}</div>}
                        {couponResult && (
                          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', fontSize: 12, color: '#4ade80' }}>
                            ✓ <strong>{couponResult.code}</strong> applied!{' '}
                            {couponResult.type === 'percentage'
                              ? `${couponResult.value}% off${couponResult.maxDiscountAmount ? ` (max ₹${couponResult.maxDiscountAmount})` : ''}`
                              : `₹${couponResult.value} off`}
                            {' '}→ Final:{' '}
                            <strong style={{ fontSize: 14 }}>₹{getDiscountedPrice(selectedPlan)}</strong>
                            <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>₹{selectedPlan.price}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={loading}
                      className="reg-btn"
                      onClick={doRegister}
                    >
                      {loading
                        ? <><div className="dark-spinner-r" /> Creating account…</>
                        : <>Create Corporate Account →</>
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}