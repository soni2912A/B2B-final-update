import React, { useEffect, useState } from 'react'
import { apiFetch, formatCurrency } from '../../utils/api.js'
import { useApp } from '../../AppContext.jsx'
import { Btn, FormGroup, Input, Modal, showToast } from '../ui/index.jsx'
import PasswordStrength from '../ui/PasswordStrength.jsx'

// Admin self-registration with Subscription Plan selection + mock payment.
// Flow: Details → Plan → Payment → Success popup.
//
// Backend contract:
//   GET  /auth/plans                 → [{ _id, name, price, billingCycle, ... }]
//   POST /auth/register-admin        → { businessId, subscriptionId, activationToken, plan, adminEmail }
//   POST /auth/activate-subscription → { paymentReference, startDate, endDate }
export default function AdminRegisterPage() {
  const { showLogin } = useApp()
  const [step, setStep] = useState(1)   // 1=details, 2=plan, 3=payment, 4=success
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    businessName: '', phone: '',
  })

  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const [pendingReg, setPendingReg] = useState(null)   // { businessId, subscriptionId, activationToken, plan, adminEmail }

  // Load plans when the user reaches step 2.
  useEffect(() => {
    if (step !== 2 || plans.length > 0) return
    setPlansLoading(true)
    apiFetch('GET', '/auth/plans')
      .then(res => setPlans(res.data?.plans || []))
      .catch(err => setError(err.message || 'Could not load plans.'))
      .finally(() => setPlansLoading(false))
  }, [step, plans.length])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function validateDetails() {
    if (!form.name.trim())         return 'Your name is required.'
    if (!/^[A-Za-z\s]+$/.test(form.name.trim())) return 'Name must contain only letters.'
    if (!form.businessName.trim()) return 'Business name is required.'
    if (!form.email.trim())        return 'Email is required.'
    if (form.password.length < 6)  return 'Password must be at least 6 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '')
      if (digits.length !== 10) return 'Phone number must be exactly 10 digits.'
    }
    return ''
  }

  function goToPlanStep(e) {
    e && e.preventDefault && e.preventDefault()
    const err = validateDetails()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  async function confirmPlan() {
    if (!selectedPlan) { setError('Pick a plan to continue.'); return }
    setError(''); setSaving(true)
    try {
      const res = await apiFetch('POST', '/auth/register-admin', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        businessName: form.businessName.trim(),
        phone: form.phone.trim() || undefined,
        planId: selectedPlan._id,
      })
      setPendingReg(res.data)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setSaving(false)
    }
  }

  async function completePayment() {
    if (!pendingReg) return
    setError(''); setSaving(true)
    try {
      await apiFetch('POST', '/auth/activate-subscription', {
        subscriptionId: pendingReg.subscriptionId,
        activationToken: pendingReg.activationToken,
        paymentReference: `MOCK-${Date.now()}`,
      })
      setStep(4)
    } catch (err) {
      setError(err.message || 'Payment could not be completed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-card p-7">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[20px] font-semibold">Register as Admin</div>
          <div className="text-[11px] text-text3 font-medium">
            Step {step < 4 ? step : '✓'} of 3
          </div>
        </div>
        <div className="text-[13px] text-text2 mb-5">
          {step === 1 && 'Create your business and admin account.'}
          {step === 2 && 'Select a subscription plan.'}
          {step === 3 && 'Complete payment to activate your account.'}
          {step === 4 && 'All set — your subscription is active.'}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-5">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1 flex-1 rounded-full ${step >= n ? 'bg-accent' : 'bg-surface2'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>
        )}

        {/* STEP 1 — Details */}
        {step === 1 && (
          <form onSubmit={goToPlanStep}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormGroup label="Your Name" required>
                <Input value={form.name} onChange={set('name')} autoComplete="name" />
              </FormGroup>
              <FormGroup label="Business Name" required>
                <Input value={form.businessName} onChange={set('businessName')} />
              </FormGroup>
            </div>
            <FormGroup label="Email Address" required>
              <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </FormGroup>
            <FormGroup label="Phone (optional)">
              <Input value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </FormGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormGroup label="Password" required hint="At least 6 characters.">
                <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
                <PasswordStrength password={form.password} />
              </FormGroup>
              <FormGroup label="Confirm Password" required>
                <Input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              </FormGroup>
            </div>
            <Btn type="submit" variant="primary" onClick={goToPlanStep}>Continue → Choose plan</Btn>
          </form>
        )}

        {/* STEP 2 — Plan selection */}
        {step === 2 && (
          <>
            {plansLoading ? (
              <div className="py-8 text-center text-text2 text-sm">Loading plans…</div>
            ) : plans.length === 0 ? (
              <div className="p-4 rounded border border-border bg-surface2 text-[13px] text-text2">
                No plans are currently available. Please contact the platform administrator.
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {plans.map(p => {
                  const selected = selectedPlan?._id === p._id
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={`w-full text-left border rounded-lg p-4 transition-all ${selected ? 'border-accent bg-accent-light' : 'border-border hover:bg-surface2'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[14px]">{p.name}</div>
                          <div className="text-[12px] text-text2 mt-0.5">
                            {p.maxCorporates} corporates · {p.maxStaffPerCorporate}/corp staff · {p.maxOrders} orders
                          </div>
                          {(p.features || []).length > 0 && (
                            <div className="text-[11px] text-text3 mt-1.5">
                              {p.features.slice(0, 3).join(' · ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[18px] font-bold">{formatCurrency(p.price)}</div>
                          <div className="text-[11px] text-text2">/ {p.billingCycle === 'yearly' ? 'year' : 'month'}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex gap-2">
              <Btn onClick={() => setStep(1)} disabled={saving}>← Back</Btn>
              <Btn variant="primary" onClick={confirmPlan} disabled={saving || !selectedPlan}>
                {saving ? 'Registering…' : 'Register & proceed to payment →'}
              </Btn>
            </div>
          </>
        )}

        {/* STEP 3 — Mock payment */}
        {step === 3 && pendingReg && (
          <>
            <div className="border border-border rounded-lg p-4 mb-4 bg-surface2">
              <div className="text-[12px] text-text2 mb-1">Amount due</div>
              <div className="text-[28px] font-bold">{formatCurrency(pendingReg.plan.price)}</div>
              <div className="text-[12px] text-text2">
                {pendingReg.plan.name} · {pendingReg.plan.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
              </div>
              <div className="border-t border-border mt-3 pt-3 text-[12px] text-text2">
                Billing to <span className="font-medium text-text1">{pendingReg.adminEmail}</span>
              </div>
            </div>

            <div className="mb-4 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[12px]">
              <b>Demo mode:</b> payment is mocked. Clicking "Pay now" marks the subscription as paid on the backend.
              Wire a real gateway (Stripe, Razorpay) to capture the payment before calling <code className="font-mono">/auth/activate-subscription</code>.
            </div>

            <div className="flex gap-2">
              <Btn onClick={() => setStep(2)} disabled={saving}>← Back</Btn>
              <Btn variant="primary" onClick={completePayment} disabled={saving}>
                {saving ? 'Processing…' : `Pay now · ${formatCurrency(pendingReg.plan.price)}`}
              </Btn>
            </div>
          </>
        )}

        {/* STEP 1-3 footer: switch to login */}
        {step < 4 && (
          <div className="mt-5 text-[13px] text-text2 text-center">
            Already have an account?{' '}
            <button type="button" className="text-accent hover:underline font-medium" onClick={showLogin}>Sign in</button>
          </div>
        )}
      </div>

      {/* STEP 4 — Success popup (Modal) */}
      {step === 4 && (
        <Modal
          title="Welcome aboard!"
          onClose={() => { showToast('You can now sign in with your admin credentials.'); showLogin() }}
          actions={[
            { label: 'Go to Sign In', primary: true, onClick: () => { showToast('You can now sign in with your admin credentials.'); showLogin() } },
          ]}
        >
          <div className="text-center py-3">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-[18px] font-semibold mb-2">
              Congratulations! You have successfully subscribed.
            </div>
            <div className="text-[13px] text-text2">
              Your <b>{pendingReg?.plan?.name}</b> subscription is now active.<br />
              Sign in with <b>{pendingReg?.adminEmail}</b> to access your dashboard.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
