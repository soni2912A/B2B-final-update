import React from 'react'

// Lightweight password-strength meter. Scoring is intentionally simple — no
// dictionary checks, no zxcvbn dep — just length + character diversity. The
// backend enforces a 6-character minimum; this component gives visual feedback
// so users aim higher on their own.
//
// Scoring (max 4):
//   +1 if ≥ 8 chars    +1 if ≥ 12 chars
//   +1 if mixed case + digit
//   +1 if contains a symbol
//
// Bands: 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong

export function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = [
  'bg-border',
  'bg-red-500',
  'bg-amber-500',
  'bg-green-400',
  'bg-green-600',
]
const HINTS = {
  0: '',
  1: 'Use at least 8 characters — mix uppercase, lowercase, and a digit.',
  2: 'Add a symbol or make it longer for a stronger password.',
  3: 'Good. A symbol or more length would make it stronger.',
  4: 'Strong — this password is solid.',
}

export default function PasswordStrength({ password, minLength = 6 }) {
  const score = scorePassword(password)
  if (!password) return null

  // Visual progress bar — 4 segments, filled based on score.
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= score ? COLORS[score] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className={score <= 1 ? 'text-red-600' : score === 2 ? 'text-amber-600' : 'text-green-700'}>
          {LABELS[score] || 'Very weak'}
        </span>
        <span className="text-text2 truncate">{HINTS[score]}</span>
      </div>
      {password.length < minLength && (
        <div className="text-[11px] text-red-600 mt-0.5">
          Minimum {minLength} characters.
        </div>
      )}
    </div>
  )
}
