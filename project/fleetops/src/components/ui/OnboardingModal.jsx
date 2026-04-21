import React, { useState } from 'react'
import { useApp } from '../../AppContext.jsx'
import { Btn, Modal } from './index.jsx'
import { ONBOARDING_STEPS, onboardingKey } from '../../data/onboardingSteps.js'

// First-login walkthrough. Shown automatically by AppShell when localStorage
// flag is missing; also mounted on-demand from Settings via `forceOpen`.
//
// Modal-based rather than DOM-anchored tooltip tour — easier to maintain,
// doesn't fight responsive layouts, and survives UI changes without breaking.
export default function OnboardingModal({ onClose }) {
  const { user, role, navigate } = useApp()
  const steps = ONBOARDING_STEPS[role] || []
  const [idx, setIdx] = useState(0)

  if (steps.length === 0) return null
  const step = steps[idx]
  const isLast = idx === steps.length - 1

  function markComplete() {
    try { localStorage.setItem(onboardingKey(user?._id), '1') } catch { /* private mode — skip */ }
  }

  function finish() {
    markComplete()
    if (step.goTo) navigate(step.goTo)
    onClose()
  }

  function skip() {
    markComplete()
    onClose()
  }

  function next() {
    if (isLast) { finish(); return }
    setIdx(i => i + 1)
  }

  function back() {
    if (idx === 0) return
    setIdx(i => i - 1)
  }

  return (
    <Modal
      title={`Getting started · ${idx + 1} of ${steps.length}`}
      onClose={skip}
      actions={[
        // Primary action is Next or Finish depending on position. Secondary
        // is "Skip tour" always — we never lock the user in.
        { label: isLast ? "Got it — let's go" : 'Next →', primary: true, onClick: next },
        ...(idx > 0 ? [{ label: '← Back', onClick: back }] : []),
        { label: 'Skip tour', onClick: skip },
      ]}
    >
      <div className="text-center py-3">
        <div className="text-[56px] mb-3 leading-none">{step.icon}</div>
        <div className="text-[18px] font-semibold mb-2">{step.title}</div>
        <div className="text-[13px] text-text2 max-w-md mx-auto">
          {step.body}
        </div>
      </div>

      {/* Progress dots — tappable so users can jump around. */}
      <div className="flex justify-center gap-1.5 mt-4">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-accent' : i < idx ? 'bg-green-400' : 'bg-border'}`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </Modal>
  )
}

// Helper for other code (SettingsPage replay button) to clear the flag.
export function resetOnboarding(userId) {
  try { localStorage.removeItem(onboardingKey(userId)) } catch { /* private mode — harmless */ }
}

// Helper for AppShell auto-show — returns true if the user hasn't completed
// the walkthrough yet. Missing key or non-'1' value both count as incomplete.
export function shouldShowOnboarding(userId) {
  try {
    return localStorage.getItem(onboardingKey(userId)) !== '1'
  } catch {
    return false   // private mode — avoid spamming the modal every render
  }
}
