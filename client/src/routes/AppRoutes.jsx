import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGate } from '../shared/auth'
import { ADMIN_NAV, AGENT_NAV, USER_NAV } from '../shared/navigation'
import PortalLayout from '../layouts/PortalLayout'
import PublicSite from '../pages/PublicSite'
import PortalChooser from '../pages/PortalChooser'
import LoginPage from '../pages/auth/LoginPage'
import UnifiedLoginPage from '../pages/auth/UnifiedLoginPage'
import UserSignupPage from '../pages/auth/UserSignupPage'
import AdminDashboardPage from '../pages/admin/Dashboard'
import AdminPlansPage from '../pages/admin/Plans'
import AdminUsersPage from '../pages/admin/Users'
import AdminOrdersPage from '../pages/admin/Orders'
import AdminSettingsPage from '../pages/admin/Settings'
import UserDashboardPage from '../pages/user/Dashboard'
import UserInboxPage from '../pages/user/Inbox'
import UserContactsPage from '../pages/user/Contacts'
import UserCampaignsPage from '../pages/user/Campaigns'
import UserAutomationFlowsPage from '../pages/user/AutomationFlows'
import UserChatBotPage from '../pages/user/ChatBot'
import UserIntegrationsPage from '../pages/user/Integrations'
import UserAgentPage from '../pages/user/AgentLogin'
import UserTaskPage from '../pages/user/AgentTask'
import UserChatWidgetPage from '../pages/user/ChatWidget'
import UserSettingsPage from '../pages/user/Settings'
import AgentDashboardPage from '../pages/agent/Dashboard'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
      <Route path="/signin" element={<PortalChooser />} />
      <Route path="/login" element={<UnifiedLoginPage />} />
      <Route path="/register" element={<Navigate to="/user/signup" replace />} />
      <Route path="/user/signup" element={<UserSignupPage />} />
      <Route
        path="/admin/login"
        element={
          <LoginPage
            role="admin"
            title="Admin Sign In"
            subtitle="Global SaaS operations for plans, tenants, orders, payments, and site configuration."
            endpoint="/api/admin/login"
          />
        }
      />
      <Route
        path="/user/login"
        element={
          <LoginPage
            role="user"
            title="User Sign In"
            subtitle="Tenant workspace for inbox, automation, campaigns, contacts, and agent management."
            endpoint="/api/user/login"
            allowSignup
          />
        }
      />
      <Route
        path="/agent/login"
        element={
          <LoginPage
            role="agent"
            title="Agent Sign In"
            subtitle="Restricted portal for assigned chats and tasks, including token-based tenant auto-login."
            endpoint="/api/agent/login"
          />
        }
      />

      <Route
        path="/admin"
        element={
          <RoleGate role="admin">
            <PortalLayout role="admin" title="Admin Portal" navItems={ADMIN_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="manage-plans" element={<AdminPlansPage />} />
        <Route path="manage-users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/user"
        element={
          <RoleGate role="user">
            <PortalLayout role="user" title="User Portal" navItems={USER_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="inbox" element={<UserInboxPage />} />
        <Route path="contacts" element={<UserContactsPage />} />
        <Route path="campaigns" element={<UserCampaignsPage />} />
        <Route path="automation-flows" element={<UserAutomationFlowsPage />} />
        <Route path="chatbot" element={<UserChatBotPage />} />
        <Route path="integrations" element={<UserIntegrationsPage />} />
        <Route path="agent-login" element={<UserAgentPage />} />
        <Route path="agent-task" element={<UserTaskPage />} />
        <Route path="chat-widget" element={<UserChatWidgetPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
      </Route>

      <Route
        path="/agent"
        element={
          <RoleGate role="agent">
            <PortalLayout role="agent" title="Agent Portal" navItems={AGENT_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="chats" element={<AgentDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
