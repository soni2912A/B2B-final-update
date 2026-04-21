import React from 'react'
import { useApp } from '../../AppContext.jsx'
import { Btn } from './index.jsx'

// Shown when a user navigates to a page whose `perm` isn't in their
// `user.permissions`. The route guard is a frontend-only courtesy — the real
// enforcement is backend middleware, which the permission tokens already feed
// (see middleware/role.middleware.js `checkPermission`). This page gives a
// useful explanation instead of a blank or broken view.
export default function AccessDenied({ perm }) {
  const { navigate, role, user } = useApp()
  const defaultPage =
    role === 'super_admin'    ? 'sa-businesses'    :
    role === 'corporate_user' ? 'corp-dashboard'   :
    'admin-dashboard'

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="text-5xl mb-3 opacity-60">🔒</div>
      <div className="text-[18px] font-semibold mb-1">Access denied</div>
      <div className="text-[13px] text-text2 mb-5">
        Your current role doesn't include access to this module.
        {perm && (
          <div className="mt-2 font-mono text-[11px] text-text3">
            Required permission: <span className="bg-surface2 px-1.5 py-0.5 rounded">{perm}</span>
          </div>
        )}
        <div className="mt-3">
          Ask an administrator to update your role
          {user?.name ? ` (${user.name})` : ''} if you need this access.
        </div>
      </div>
      <Btn variant="primary" onClick={() => navigate(defaultPage)}>Go to dashboard</Btn>
    </div>
  )
}
