import React from 'react'
import { AppProvider, useApp } from './AppContext.jsx'
import LoginPage from './components/pages/LoginPage.jsx'
import RegisterPage from './components/pages/RegisterPage.jsx'
import AdminRegisterPage from './components/pages/AdminRegisterPage.jsx'
import AcceptInvitePage from './components/pages/AcceptInvitePage.jsx'
import { ForgotPasswordPage, ResetPasswordPage } from './components/pages/ForgotResetPage.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import { ToastContainer, showToast } from './components/ui/index.jsx'
import IdleWarningModal from './components/ui/IdleWarningModal.jsx'
import AccessDenied from './components/ui/AccessDenied.jsx'
import OnboardingModal, { shouldShowOnboarding } from './components/ui/OnboardingModal.jsx'
import useIdleTimeout from './hooks/useIdleTimeout.js'
import { hasPermission, navItemFor } from './data/navigation.js'
import { useEffect, useState } from 'react'

// Admin pages
import AdminDashboard from './components/pages/admin/AdminDashboard.jsx'
import OrdersPage     from './components/pages/admin/OrdersPage.jsx'
import DeliveriesPage from './components/pages/admin/DeliveriesPage.jsx'
import CoordinatorPage from './components/pages/admin/CoordinatorPage.jsx'
import RefundsPage from './components/pages/admin/RefundsPage.jsx'
import CorporatesPage from './components/pages/admin/CorporatesPage.jsx'
import ProductsPage   from './components/pages/admin/ProductsPage.jsx'
import InvoicesPage   from './components/pages/admin/InvoicesPage.jsx'
import ReportsPage    from './components/pages/admin/ReportsPage.jsx'
import { OccasionsPage, FeedbackPage, DiscountsPage, TicketsPage, InventoryPage, NotifPrefsPage } from './components/pages/admin/MiscPages.jsx'
import { EmailTemplatesPage, LoginLogsPage, EmailLogsPage, ImportExportPage, AdminUsersPage, SettingsPage } from './components/pages/admin/SystemPages.jsx'
import RolesPermissionsPage from './components/pages/admin/RolesPermissionsPage.jsx'

// Corporate pages
import { CorpDashboard, CorpStaffPage, PlaceOrderPage, CorpUsersPage, CorpOccasionsPage, CorpTicketsPage, CorpFeedbackPage } from './components/pages/corporate/CorpPages.jsx'

// Super admin pages
import { SABusinessesPage, SASubscriptionsPage, SAPlatformLogsPage } from './components/pages/superadmin/SAPages.jsx'

const ROUTE_MAP = {
  'admin-dashboard':    AdminDashboard,
  'admin-orders':       OrdersPage,
  'admin-deliveries':   DeliveriesPage,
  'admin-coordinator':  CoordinatorPage,
  'admin-invoices':     InvoicesPage,
  'admin-refunds':      RefundsPage,
  'admin-corporates':   CorporatesPage,
  'admin-products':     ProductsPage,
  'admin-reports':      ReportsPage,
  'admin-occasions':    OccasionsPage,
  'admin-feedback':     FeedbackPage,
  'admin-discounts':    DiscountsPage,
  'admin-tickets':      TicketsPage,
  'admin-inventory':    InventoryPage,
  'admin-notif-prefs':  NotifPrefsPage,
  'admin-templates':    EmailTemplatesPage,
  'admin-logs':         LoginLogsPage,
  'admin-email-logs':   EmailLogsPage,
  'admin-import-export':ImportExportPage,
  'admin-users':        AdminUsersPage,
  'admin-roles':        () => <RolesPermissionsPage scope="business" />,
  'admin-settings':     SettingsPage,

  'corp-dashboard':   CorpDashboard,
  'corp-orders':      OrdersPage,
  'corp-place-order': PlaceOrderPage,
  'corp-invoices':    InvoicesPage,
  'corp-staff':       CorpStaffPage,
  'corp-occasions':   CorpOccasionsPage,
  'corp-users':       CorpUsersPage,
  'corp-tickets':     CorpTicketsPage,
  'corp-feedback':    CorpFeedbackPage,
  'corp-notif-prefs': NotifPrefsPage,

  'sa-businesses':    SABusinessesPage,
  'sa-subscriptions': SASubscriptionsPage,
  'sa-roles':         () => <RolesPermissionsPage scope="system" />,
  'sa-logs':          SAPlatformLogsPage,
}

function AppShell() {
  const { user, page, sidebarOpen, setSidebarOpen, authView, logout } = useApp()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Show the walkthrough once per user per browser, and only after user +
  // role are ready (role drives the step list). Manual triggers (replay
  // button in Settings) listen for this same state via a window event.
  useEffect(() => {
    if (user && shouldShowOnboarding(user._id)) {
      // small delay so the main shell is visible behind the modal for context
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }
  }, [user])

  useEffect(() => {
    function onReplay() { setShowOnboarding(true) }
    window.addEventListener('onboarding:replay', onReplay)
    return () => window.removeEventListener('onboarding:replay', onReplay)
  }, [])

  // Idle timeout — only active while a user is logged in. Warning fires at
  // 28 min; forced logout at 30 min. Numbers match the backend's JWT expiry
  // tolerance (7d access token), not a session duration, but that's OK —
  // this is a UX layer, not a security boundary.
  const { warning, secondsLeft, stayLoggedIn } = useIdleTimeout({
    enabled: !!user,
    timeoutMs: 30 * 60 * 1000,
    warningMs: 2 * 60 * 1000,
    onTimeout: () => {
      showToast('Your session has expired. Please sign in again.', 'info')
      logout()
    },
  })

  // Public invite-accept page — shown when the invitee lands on the emailed URL.
  // Must resolve before the auth guard so logged-in admins can still hit an invite
  // for a different account in another tab without being booted to their dashboard.
  if (typeof window !== 'undefined' && window.location.pathname === '/accept-invite') {
    return <AcceptInvitePage />
  }

  // Public reset-password page — deep-linked from the forgot-password email.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password/')) {
    return <ResetPasswordPage />
  }

  // URL-based routing from landing page links:
  // /login  → show LoginPage
  // /register or /free-trial → show RegisterPage
  // This lets the landing page link directly to the right auth screen.
  if (!user) {
    if (authView === 'register')       return <RegisterPage />
    if (authView === 'admin-register') return <AdminRegisterPage />
    if (authView === 'forgot')         return <ForgotPasswordPage />
    return <LoginPage />
  }

  // Once logged in, clean up the URL so it shows / instead of /login or /register
  if (typeof window !== 'undefined' &&
      (window.location.pathname === '/login' ||
       window.location.pathname === '/register' ||
       window.location.pathname === '/free-trial')) {
    window.history.replaceState({}, '', '/')
  }

  const PageComponent = ROUTE_MAP[page]

  // Permission check for the current page — show AccessDenied instead of the
  // real component when the user's role+permission combination doesn't grant
  // access. Users with an empty permissions[] always pass (legacy accounts).
  const currentNavItem = navItemFor(page)
  const currentPerm = currentNavItem?.perm
  const canAccess = hasPermission(user, currentPerm)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          {!canAccess ? (
            <AccessDenied perm={currentPerm} />
          ) : PageComponent ? <PageComponent /> : (
            <div className="text-center py-16 text-text2">
              <div className="text-4xl mb-3 opacity-30">🚧</div>
              <div className="text-sm">Module coming soon</div>
            </div>
          )}
        </main>
      </div>

      <ToastContainer />

      {warning && (
        <IdleWarningModal
          secondsLeft={secondsLeft}
          onStay={stayLoggedIn}
          onLogout={logout}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
