import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate } from '../../utils/api.js'
import { Card, PageHeader, Loading } from '../ui/index.jsx'
import { showToast } from '../ui/index.jsx'
import { useApp } from '../../AppContext.jsx'

export default function ReferralPage() {
  const { user } = useApp()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)

  const endpoint = user?.role === 'super_admin'
    ? '/super-admin/referrals/me'
    : user?.role === 'admin'
      ? '/admin/referral/me'
      : '/corporate/referral/me'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', endpoint)
      setData(res.data?.referral || null)
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [endpoint])

  useEffect(() => { load() }, [load])

  function copyLink() {
    if (!data?.link) return
    navigator.clipboard.writeText(data.link).then(() => {
      setCopied(true)
      showToast('Referral link copied!')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function copyCode() {
    if (!data?.code) return
    navigator.clipboard.writeText(data.code).then(() => {
      showToast('Referral code copied!')
    })
  }

  const isAdmin   = user?.role === 'admin' || user?.role === 'super_admin'
  const target    = isAdmin ? 'new businesses (admins)' : 'other companies (corporates)'
  const regLabel  = isAdmin ? 'Admin Registration' : 'Corporate Registration'

  // Format discount for display
  function formatDiscount(type, value) {
    if (!type || !value) return null
    if (type === 'percentage') return `${value}% OFF`
    return `₹${value} OFF`
  }

  if (loading) return <div className="p-8"><Loading /></div>

  return (
    <div>
      <PageHeader
        title="My Referral"
        subtitle={`Share your link and earn rewards when ${target} subscribe`}
      />

      {/* How it works */}
      <div className="mb-6 p-4 rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
        <div className="font-semibold text-[13px] text-purple-800 dark:text-purple-200 mb-3">🎯 How Referral Rewards Work</div>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            { step: '1', label: 'Share your link',           desc: `Send your referral link to ${target}` },
            { step: '2', label: 'They register',             desc: 'They sign up using your referral link or code' },
            { step: '3', label: 'They complete payment',     desc: 'Reward is only granted after their first subscription payment' },
            { step: '4', label: '₹500 credit for you',       desc: 'You automatically receive your reward' },
          ].map(s => (
            <div key={s.step} className="flex-1 flex gap-2 items-start">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
              <div>
                <div className="text-[12px] font-semibold text-text1">{s.label}</div>
                <div className="text-[11px] text-text2 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Discount tag */}
        {data && data.discountValue > 0 && (
          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-purple-800/40 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-600">
              <span className="text-[18px]">🎟️</span>
              <div>
                <div className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold uppercase tracking-wider">Referral Discount</div>
                <div className="text-[15px] font-bold text-purple-900 dark:text-purple-100">{formatDiscount(data.discountType, data.discountValue)}</div>
              </div>
            </div>
            <div className="text-[12px] text-purple-700 dark:text-purple-300">
              People who register with your code get <strong>{formatDiscount(data.discountType, data.discountValue)}</strong> on their subscription.
            </div>
          </div>
        )}
      </div>

      {data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Referral Code',    value: data.code,             mono: true, icon: '🔑' },
              { label: 'Link Clicks',      value: data.totalClicks,      icon: '👆' },
              { label: 'Conversions',      value: `${data.totalConversions} / ${data.maxUses}`, icon: '🎯' },
              { label: 'Uses Remaining',   value: data.usesRemaining,    icon: data.usesRemaining <= 2 ? '⚠️' : '✅', highlight: data.usesRemaining <= 2 },
            ].map(s => (
              <Card key={s.label} className="!p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-xl font-bold ${s.mono ? 'font-mono tracking-widest text-accent' : s.highlight ? 'text-orange-500' : 'text-text1'}`}>
                  {s.value}
                </div>
                <div className="text-xs text-text2 mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Share section */}
          <Card className="mb-6">
            <div className="text-sm font-semibold text-text1 mb-4">📤 Share Your Referral</div>

            {/* Referral link */}
            <div className="mb-4">
              <label className="text-xs text-text2 font-medium mb-1.5 block">{regLabel} Link</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-surface border border-border rounded-xl px-4 py-2.5 gap-2 min-w-0">
                  <span className="text-[12px] text-text2 truncate">{data.link}</span>
                </div>
                <button
                  onClick={copyLink}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: copied
                      ? 'linear-gradient(135deg,#4ade80,#22c55e)'
                      : 'linear-gradient(135deg,#ff8a5c,#a56bff)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0,
                    transition: 'background .2s',
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Code only */}
            <div>
              <label className="text-xs text-text2 font-medium mb-1.5 block">Referral Code (they can enter manually)</label>
              <div className="flex gap-2 items-center">
                <span className="font-mono font-bold text-2xl tracking-[0.3em] text-accent px-4 py-2 bg-surface border border-border rounded-xl">
                  {data.code}
                </span>
                <button
                  onClick={copyCode}
                  className="text-sm text-text2 hover:text-text1 underline"
                >
                  Copy code
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {[
                { label: '📧 Email',    href: `mailto:?subject=Join ${isAdmin ? 'our platform' : 'us'}&body=Use my referral link to register: ${data.link}` },
                { label: '💬 WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`Join and get started! Use my referral link: ${data.link}`)}` },
              ].map(b => (
                <a
                  key={b.label}
                  href={b.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text2)',
                    fontSize: 12, fontWeight: 500, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  {b.label}
                </a>
              ))}
            </div>
          </Card>

          {/* Recent conversions */}
          {data.recentConversions?.length > 0 && (
            <Card>
              <div className="text-sm font-semibold text-text1 mb-4">📋 Recent Conversions</div>
              <div className="flex flex-col gap-2">
                {data.recentConversions.map((c, i) => (
                  <div key={c._id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-[13px] text-text1 font-medium">Signup #{i + 1}</div>
                      <div className="text-[11px] text-text2">{formatDate(c.convertedAt)}</div>
                    </div>
                    <div className="text-right">
                      {c.rewardGiven ? (
                        <div>
                          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Reward: ₹{c.rewardValue} {c.rewardType}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          ⏳ Awaiting payment
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="text-center py-12 text-text2">
          <div className="text-4xl mb-3">🔗</div>
          <div className="text-sm">Could not load your referral data. Try refreshing.</div>
        </Card>
      )}
    </div>
  )
}