import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate } from '../../../utils/api.js'
import { Card, PageHeader, TableWrap, Loading } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

export function SAReferralsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/super-admin/referrals')
      setList(res.data?.referrals || [])
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalConversions = list.reduce((s, r) => s + r.totalConversions, 0)
  const totalRewards     = list.reduce((s, r) => s + r.conversions.filter(c => c.rewardGiven).length, 0)

  return (
    <div>
      <PageHeader title="Referrals Overview" subtitle="All referral codes across admin and corporate users" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Referrers',    value: list.length,        icon: '👥' },
          { label: 'Total Conversions',  value: totalConversions,   icon: '🎯' },
          { label: 'Rewards Granted',    value: totalRewards,       icon: '🎁' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-3 !p-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold text-text1">{s.value}</div>
              <div className="text-xs text-text2">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Role</th>
                <th>Business</th>
                <th>Code</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Rewards Given</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text2 text-sm">
                  <div className="text-3xl mb-2">🔗</div>No referrals yet.
                </td></tr>
              ) : list.map(r => (
                <tr key={r._id}>
                  <td className="font-medium">{r.referrer?.name || '—'}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${r.referrer?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {r.referrer?.role === 'admin' ? 'Admin' : 'Corporate'}
                    </span>
                  </td>
                  <td className="text-text2 text-sm">{r.business?.name || '—'}</td>
                  <td>
                    <span className="font-mono font-bold text-accent tracking-widest text-[13px]">{r.code}</span>
                  </td>
                  <td className="text-text2 text-center">{r.totalClicks}</td>
                  <td className="text-center">
                    <span className={`font-semibold ${r.totalConversions > 0 ? 'text-emerald-500' : 'text-text2'}`}>
                      {r.totalConversions}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`font-semibold ${r.conversions.filter(c=>c.rewardGiven).length > 0 ? 'text-yellow-500' : 'text-text2'}`}>
                      {r.conversions.filter(c => c.rewardGiven).length}
                    </span>
                  </td>
                  <td className="text-text2 text-sm">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  )
}