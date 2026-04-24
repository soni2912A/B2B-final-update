import React from 'react'
import { Btn, Modal } from './index.jsx'



export default function IdleWarningModal({ secondsLeft, onStay, onLogout }) {
  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, '0')
  return (
    <Modal
      title="Session about to expire"
      onClose={onStay}
      actions={[
        { label: 'Stay logged in', primary: true, onClick: onStay },
        { label: 'Log out now', onClick: onLogout },
      ]}
    >
      <div className="text-center py-3">
        <div className="text-4xl mb-2">⏳</div>
        <div className="text-[15px] font-medium mb-1">
          You'll be logged out in {mm}:{ss}
        </div>
        <div className="text-[13px] text-text2">
          For your security, inactive sessions end automatically.<br />
          Click "Stay logged in" to continue working.
        </div>
      </div>
    </Modal>
  )
}
