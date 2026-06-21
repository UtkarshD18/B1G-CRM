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
import AdminFrontPartnerPage from '../pages/admin/FrontPartner'
import AdminFaqPage from '../pages/admin/Faq'
import AdminManagePages from '../pages/admin/ManagePages'
import AdminTestimonialPage from '../pages/admin/Testimonial'
import AdminContactFormPage from '../pages/admin/ContactForm'
import AdminPaymentGatewaysPage from '../pages/admin/PaymentGateways'
import AdminSmtpPage from '../pages/admin/SmtpSettings'
import AdminSocialLoginPage from '../pages/admin/SocialLogin'
import AdminSiteSettingsPage from '../pages/admin/SiteSettings'
import UserDashboardPage from '../pages/user/Dashboard'
import UserInboxPage from '../pages/user/Inbox'
import UserKanbanPage from '../pages/user/Kanban'
import UserContactsPage from '../pages/user/Contacts'
import UserCampaignsPage from '../pages/user/Campaigns'
import UserAutomationFlowsPage from '../pages/user/AutomationFlows'
import UserChatBotPage from '../pages/user/ChatBot'
import UserIntegrationsPage from '../pages/user/Integrations'
import UserAgentPage from '../pages/user/AgentLogin'
import UserTaskPage from '../pages/user/AgentTask'
import UserChatWidgetPage from '../pages/user/ChatWidget'
import UserBillingPage from '../pages/user/Billing'
import UserDeveloperApiPage from '../pages/user/DeveloperApi'
import UserMetaTemplatesPage from '../pages/user/MetaTemplates'
import UserSettingsPage from '../pages/user/Settings'
import AgentDashboardPage from '../pages/agent/Dashboard'
import AgentInboxPage from '../pages/agent/Inbox'
import ReferenceModulePage from '../pages/ReferenceModulePage'
import UserAiProvidersPage from '../pages/user/AiProviderSettings'
import UserKnowledgeBasePage from '../pages/user/KnowledgeBase'
import UserWebsiteManagerPage from '../pages/user/WebsiteManager'
import UserCrmPipelinePage from '../pages/user/CrmPipeline'
import UserSupervisorDashboardPage from '../pages/user/SupervisorDashboard'
import UserWebhookLogsPage from '../pages/user/WebhookLogs'

export const ADMIN_REFERENCE_ROUTES = [
  { path: 'dashboard', component: 'dashboard' },
  { path: 'manage-plans', component: 'plans' },
  { path: 'manage-users', component: 'users' },
  { path: 'orders', component: 'orders' },
  { path: 'settings', component: 'settings' },
  { path: 'front-partner', component: 'frontPartner' },
  { path: 'faq', component: 'faq' },
  { path: 'manage-page', component: 'managePage' },
  { path: 'testimonial', component: 'testimonial' },
  { path: 'contact-form', component: 'contactForm' },
  { path: 'payment-gateways', component: 'paymentGateways' },
  { path: 'social-login', component: 'socialLogin' },
  { path: 'site-settings', component: 'siteSettings' },
  { path: 'smtp', component: 'smtpSettings' },
  { path: 'web-theme', component: 'settings' },
  { path: 'translation', component: 'settings' },
  { path: 'update-web', component: 'settings' },
  { path: 'wa-link', component: 'planned', title: 'WA Links Data' },
  { path: 'flow-builder-template', component: 'planned', title: 'Flowbuilder Template' },
  { path: 'qr-plugin-settings', component: 'planned', title: 'QR Plugin Settings' },
  { path: 'instagram-config', component: 'planned', title: 'Instagram Config' },
  { path: 'web-notification', component: 'planned', title: 'Web Notification' },
  { path: 'send-web-push', component: 'planned', title: 'Manual Web Push' },
  { path: 'embed-config', component: 'planned', title: 'WA Embed Login' },
  { path: 'telegram-config', component: 'planned', title: 'Telegram Config' },
]

export const USER_REFERENCE_ROUTES = [
  { path: 'dashboard', component: 'dashboard' },
  { path: 'inbox', component: 'inbox' },
  { path: 'contacts', component: 'contacts' },
  { path: 'phonebook', component: 'contacts' },
  { path: 'campaigns', component: 'campaigns' },
  { path: 'send-campaign', component: 'campaigns' },
  { path: 'campaign-dashboard', component: 'campaigns' },
  { path: 'automation-flows', component: 'flows' },
  { path: 'chatbot', component: 'chatbot' },
  { path: 'wa-chatbot', component: 'chatbot' },
  { path: 'integrations', component: 'integrations' },
  { path: 'add-whatsapp-qr', component: 'integrations' },
  { path: 'link-meta-whatsapp', component: 'integrations' },
  { path: 'link-instagram', component: 'integrations' },
  { path: 'agent-login', component: 'agents' },
  { path: 'agent-task', component: 'tasks' },
  { path: 'chat-widget', component: 'widget' },
  { path: 'billing', component: 'billing' },
  { path: 'api-dashboard', component: 'developerApi' },
  { path: 'rest-api', component: 'developerApi' },
  { path: 'conversational-api', component: 'developerApi' },
  { path: 'template-api', component: 'developerApi' },
  { path: 'manage-webhooks', component: 'developerApi' },
  { path: 'settings', component: 'settings' },
  { path: 'kanban', component: 'kanban' },
  { path: 'kabnan', component: 'kanban' },
  { path: 'whatsapp-forms', component: 'planned', title: 'WhatsApp Forms' },
  { path: 'insta-dm-bot', component: 'planned', title: 'Instagram DM Bot' },
  { path: 'insta-comment-dm', component: 'planned', title: 'Instagram Comment DM' },
  { path: 'whatsapp-warmer', component: 'planned', title: 'WhatsApp Warmer' },
  { path: 'create-meta-template', component: 'metaTemplates' },
  { path: 'create-call-flow', component: 'planned', title: 'Create Call Flow' },
  { path: 'wa-call-logs', component: 'planned', title: 'WA Call Logs' },
  { path: 'setup-wa-calls', component: 'planned', title: 'Setup WA Calls' },
  { path: 'webhook-automation', component: 'planned', title: 'Webhook Automation' },
  { path: 'webhook-logs', component: 'webhookLogs' },
  { path: 'telegram-sessions', component: 'planned', title: 'Telegram Sessions' },
  { path: 'web-notification', component: 'planned', title: 'Web Notification' },
  { path: 'ai-providers', component: 'aiProviders' },
  { path: 'knowledge-base', component: 'knowledgeBase' },
  { path: 'website-manager', component: 'websiteManager' },
  { path: 'pipeline', component: 'pipeline' },
  { path: 'supervisor-dashboard', component: 'supervisorDashboard' },
]

const adminRouteComponents = {
  dashboard: AdminDashboardPage,
  plans: AdminPlansPage,
  users: AdminUsersPage,
  orders: AdminOrdersPage,
  settings: AdminSettingsPage,
  frontPartner: AdminFrontPartnerPage,
  faq: AdminFaqPage,
  managePage: AdminManagePages,
  testimonial: AdminTestimonialPage,
  contactForm: AdminContactFormPage,
  paymentGateways: AdminPaymentGatewaysPage,
  smtpSettings: AdminSmtpPage,
  socialLogin: AdminSocialLoginPage,
  siteSettings: AdminSiteSettingsPage,
}

const userRouteComponents = {
  dashboard: UserDashboardPage,
  inbox: UserInboxPage,
  kanban: UserKanbanPage,
  contacts: UserContactsPage,
  campaigns: UserCampaignsPage,
  flows: UserAutomationFlowsPage,
  chatbot: UserChatBotPage,
  integrations: UserIntegrationsPage,
  agents: UserAgentPage,
  tasks: UserTaskPage,
  widget: UserChatWidgetPage,
  billing: UserBillingPage,
  developerApi: UserDeveloperApiPage,
  metaTemplates: UserMetaTemplatesPage,
  settings: UserSettingsPage,
  aiProviders: UserAiProvidersPage,
  knowledgeBase: UserKnowledgeBasePage,
  websiteManager: UserWebsiteManagerPage,
  pipeline: UserCrmPipelinePage,
  supervisorDashboard: UserSupervisorDashboardPage,
  webhookLogs: UserWebhookLogsPage,
}

function renderReferenceRoutes(routes, area, components) {
  return routes.map((route) => {
    if (route.component === 'planned') {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ReferenceModulePage
              area={area}
              title={route.title}
              dependencies={['Data model', 'API contract', 'Production UI']}
            />
          }
        />
      )
    }

    const Component = components[route.component]
    return <Route key={route.path} path={route.path} element={<Component />} />
  })
}

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
        {renderReferenceRoutes(ADMIN_REFERENCE_ROUTES, 'admin module', adminRouteComponents)}
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
        {renderReferenceRoutes(USER_REFERENCE_ROUTES, 'user module', userRouteComponents)}
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
        <Route path="chats" element={<AgentInboxPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
