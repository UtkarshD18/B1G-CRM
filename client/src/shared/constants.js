export const PUBLIC_FEATURES = [
  'AI voice calling and task-aware follow-up flows',
  'Smart inbox for WhatsApp, Instagram, and website chat',
  'Automation flows, chatbots, and webhook-triggered journeys',
  'Campaigns, phonebook segmentation, and agent handoff controls',
]

export const USER_MODULES = [
  'Inbox',
  'Automation Flows',
  'Send Campaign',
  'Phonebook',
  'Agent Login',
  'Agent Task',
  'Chat Widget',
  'Manage Webhooks',
]

export const ADMIN_MODULES = [
  'Manage Plans',
  'Manage Users',
  'Orders',
  'Payment Gateways',
  'SMTP',
  'Site Settings',
]

export const AGENT_MODULES = ['Assigned chats', 'Task queue', 'Restricted visibility']

export const DEFAULT_PLANS = [
  {
    id: 'trial',
    title: 'Trial',
    short_description: '10-day evaluation for onboarding teams',
    plan_duration_in_days: 10,
    price: 0,
    is_trial: 1,
  },
  {
    id: 'premium',
    title: 'Premium',
    short_description: 'Core inbox, automation, and campaign workspace',
    plan_duration_in_days: 365,
    price: 149,
  },
  {
    id: 'platinum',
    title: 'Platinum',
    short_description: 'Broader automation, API, and scaling controls',
    plan_duration_in_days: 365,
    price: 299,
  },
]
