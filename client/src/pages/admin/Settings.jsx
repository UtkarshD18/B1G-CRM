import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime } from '../../shared/format'

const tabs = ['Web', 'Payments', 'SMTP', 'CMS', 'Leads', 'Social', 'Deployment', 'Theme', 'Translation', 'Update Web']

const defaultThemes = [
  {
    id: 'default',
    name: 'Default Theme',
    avatar: 'A',
    description: 'Factory default — protected and cannot be deleted',
    updated: '16/03/2026',
    protected: true,
    colors: {
      primary: { main: '#35d472', light: '#ECF2E6', dark: '#1a8c40' },
      secondary: { main: '#56d687', light: '#E8F7E6', dark: '#36a04c' },
      success: { main: '#22a454', light: '#56d687', dark: '#1a8c40', contrastText: '#ffffff' },
      info: { main: '#539BFF', light: '#EBF3FE', dark: '#1682d4', contrastText: '#ffffff' },
      error: { main: '#FA896B', light: '#FDEDE8', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#FFAE1F', light: '#FEF5E5', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#EBF3FE', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#F2F6FA', '200': '#EAEFF4', '300': '#DFE5EF', '400': '#7C8FAC', '500': '#5A6A85', '600': '#2A3547' },
      text: { primary: '#111f0f', secondary: '#5A6A85' },
      action: { disabledBackground: 'rgba(73,82,88,0.12)', hoverOpacity: 0.02, hover: '#f6f9fc' },
      divider: '#e5eaef'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    avatar: 'S',
    description: 'Warm amber and rose tones inspired by golden hour',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#ff7e5f', light: '#fff0ec', dark: '#d15335' },
      secondary: { main: '#feb47b', light: '#fffaf4', dark: '#c97e45' },
      success: { main: '#22a454', light: '#56d687', dark: '#1a8c40', contrastText: '#ffffff' },
      info: { main: '#539BFF', light: '#EBF3FE', dark: '#1682d4', contrastText: '#ffffff' },
      error: { main: '#FA896B', light: '#FDEDE8', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#FFAE1F', light: '#FEF5E5', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#EBF3FE', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#F2F6FA', '200': '#EAEFF4', '300': '#DFE5EF', '400': '#7C8FAC', '500': '#5A6A85', '600': '#2A3547' },
      text: { primary: '#2a1a15', secondary: '#7a6a65' },
      action: { disabledBackground: 'rgba(73,82,88,0.12)', hoverOpacity: 0.02, hover: '#fff6f4' },
      divider: '#f5eae5'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    avatar: 'F',
    description: 'Deep greens and earthy tones inspired by ancient woodland',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#2d5a27', light: '#eef6ed', dark: '#1e3d1a' },
      secondary: { main: '#a0522d', light: '#faf0eb', dark: '#7d3f22' },
      success: { main: '#22a454', light: '#56d687', dark: '#1a8c40', contrastText: '#ffffff' },
      info: { main: '#539BFF', light: '#EBF3FE', dark: '#1682d4', contrastText: '#ffffff' },
      error: { main: '#FA896B', light: '#FDEDE8', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#FFAE1F', light: '#FEF5E5', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#EBF3FE', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#F2F6FA', '200': '#EAEFF4', '300': '#DFE5EF', '400': '#7C8FAC', '500': '#5A6A85', '600': '#2A3547' },
      text: { primary: '#152513', secondary: '#5a6b58' },
      action: { disabledBackground: 'rgba(73,82,88,0.12)', hoverOpacity: 0.02, hover: '#f2f8f1' },
      divider: '#e2ede0'
    }
  },
  {
    id: 'violet',
    name: 'Violet',
    avatar: 'V',
    description: 'Rich purple and lavender tones inspired by twilight and amethyst',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#7f00ff', light: '#f3ebff', dark: '#5c00b8' },
      secondary: { main: '#e100ff', light: '#fdebff', dark: '#a300ba' },
      success: { main: '#22a454', light: '#56d687', dark: '#1a8c40', contrastText: '#ffffff' },
      info: { main: '#539BFF', light: '#EBF3FE', dark: '#1682d4', contrastText: '#ffffff' },
      error: { main: '#FA896B', light: '#FDEDE8', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#FFAE1F', light: '#FEF5E5', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#f3ebff', A100: '#7f00ff', A200: '#e100ff' },
      grey: { '100': '#F2F6FA', '200': '#EAEFF4', '300': '#DFE5EF', '400': '#7C8FAC', '500': '#5A6A85', '600': '#2A3547' },
      text: { primary: '#1b0a2d', secondary: '#67587c' },
      action: { disabledBackground: 'rgba(73,82,88,0.12)', hoverOpacity: 0.02, hover: '#fcf8ff' },
      divider: '#f3eaff'
    }
  },
  {
    id: 'sharp',
    name: 'Sharp',
    avatar: 'S',
    description: 'Brutalist design — hard edges, zero radius, bold and unapologetic',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#000000', light: '#f5f5f5', dark: '#000000' },
      secondary: { main: '#ffffff', light: '#ffffff', dark: '#dddddd' },
      success: { main: '#00ff00', light: '#f0fff0', dark: '#00aa00', contrastText: '#000000' },
      info: { main: '#0000ff', light: '#f0f0ff', dark: '#0000aa', contrastText: '#ffffff' },
      error: { main: '#ff0000', light: '#fff0f0', dark: '#aa0000', contrastText: '#ffffff' },
      warning: { main: '#ffff00', light: '#fffff0', dark: '#aaaa00', contrastText: '#000000' },
      purple: { A50: '#f5f5f5', A100: '#000000', A200: '#ffffff' },
      grey: { '100': '#f0f0f0', '200': '#e0e0e0', '300': '#cccccc', '400': '#888888', '500': '#555555', '600': '#000000' },
      text: { primary: '#000000', secondary: '#555555' },
      action: { disabledBackground: 'rgba(0,0,0,0.12)', hoverOpacity: 0.02, hover: '#eeeeee' },
      divider: '#cccccc'
    }
  },
  {
    id: 'bubbly',
    name: 'Bubbly',
    avatar: 'B',
    description: 'Maximum roundness, soft shadows, playful and approachable UI',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#ff4081', light: '#ffeef4', dark: '#c51162' },
      secondary: { main: '#00e5ff', light: '#e0f7fa', dark: '#00b8d4' },
      success: { main: '#00e676', light: '#e8f5e9', dark: '#00c853', contrastText: '#ffffff' },
      info: { main: '#2979ff', light: '#e8eaf6', dark: '#1565c0', contrastText: '#ffffff' },
      error: { main: '#ff1744', light: '#ffebee', dark: '#d50000', contrastText: '#ffffff' },
      warning: { main: '#ffea00', light: '#fffde7', dark: '#ffd600', contrastText: '#000000' },
      purple: { A50: '#f3e5f5', A100: '#ab47bc', A200: '#7b1fa2' },
      grey: { '100': '#f5f5f5', '200': '#eeeeee', '300': '#e0e0e0', '400': '#bdbdbd', '500': '#9e9e9e', '600': '#424242' },
      text: { primary: '#263238', secondary: '#546e7a' },
      action: { disabledBackground: 'rgba(0,0,0,0.08)', hoverOpacity: 0.05, hover: '#fff0f5' },
      divider: '#f8bbd0'
    }
  },
  {
    id: 'glass',
    name: 'Glass',
    avatar: 'G',
    description: 'Frosted glass aesthetic — translucent surfaces, heavy blur, airy depth',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#ffffff', light: 'rgba(255,255,255,0.4)', dark: '#dddddd' },
      secondary: { main: 'rgba(255,255,255,0.2)', light: 'rgba(255,255,255,0.1)', dark: 'rgba(255,255,255,0.3)' },
      success: { main: '#2ecc71', light: 'rgba(46,204,113,0.2)', dark: '#27ae60', contrastText: '#ffffff' },
      info: { main: '#3498db', light: 'rgba(52,152,219,0.2)', dark: '#2980b9', contrastText: '#ffffff' },
      error: { main: '#e74c3c', light: 'rgba(231,76,60,0.2)', dark: '#c0392b', contrastText: '#ffffff' },
      warning: { main: '#f1c40f', light: 'rgba(241,196,15,0.2)', dark: '#d35400', contrastText: '#ffffff' },
      purple: { A50: 'rgba(255,255,255,0.2)', A100: '#9b59b6', A200: '#8e44ad' },
      grey: { '100': 'rgba(255,255,255,0.1)', '200': 'rgba(255,255,255,0.2)', '300': 'rgba(255,255,255,0.3)', '400': '#7f8c8d', '500': '#bdc3c7', '600': '#2c3e50' },
      text: { primary: '#2c3e50', secondary: '#7f8c8d' },
      action: { disabledBackground: 'rgba(255,255,255,0.2)', hoverOpacity: 0.05, hover: 'rgba(255,255,255,0.15)' },
      divider: 'rgba(255,255,255,0.2)'
    }
  },
  {
    id: 'editorial',
    name: 'Editorial',
    avatar: 'E',
    description: 'Newspaper-inspired — serif typography, tight spacing, high contrast, minimal chrome',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#111111', light: '#fbfbfb', dark: '#000000' },
      secondary: { main: '#888888', light: '#f0f0f0', dark: '#555555' },
      success: { main: '#127a3c', light: '#ebfdf3', dark: '#093e1e', contrastText: '#ffffff' },
      info: { main: '#1c5aa3', light: '#edf5fd', dark: '#0e2e54', contrastText: '#ffffff' },
      error: { main: '#b32424', light: '#fdf3f3', dark: '#5c1212', contrastText: '#ffffff' },
      warning: { main: '#a87311', light: '#fdfbeb', dark: '#593d09', contrastText: '#ffffff' },
      purple: { A50: '#fbfbfb', A100: '#222222', A200: '#ffffff' },
      grey: { '100': '#f5f5f5', '200': '#e9e9e9', '300': '#dcdcdc', '400': '#999999', '500': '#555555', '600': '#111111' },
      text: { primary: '#111111', secondary: '#555555' },
      action: { disabledBackground: 'rgba(0,0,0,0.06)', hoverOpacity: 0.02, hover: '#f9f9f9' },
      divider: '#e9e9e9'
    }
  },
  {
    id: 'cyber',
    name: 'Cyber',
    avatar: 'C',
    description: 'Terminal-inspired — neon glow effects, monospace font, dark-first hacker aesthetic',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#00ff00', light: '#051f05', dark: '#00aa00' },
      secondary: { main: '#00ffff', light: '#051f1f', dark: '#00aaaa' },
      success: { main: '#00ff00', light: '#051f05', dark: '#008800', contrastText: '#000000' },
      info: { main: '#0000ff', light: '#00001f', dark: '#000088', contrastText: '#ffffff' },
      error: { main: '#ff0033', light: '#1f0005', dark: '#880011', contrastText: '#ffffff' },
      warning: { main: '#ffff00', light: '#1f1f00', dark: '#888800', contrastText: '#000000' },
      purple: { A50: '#001100', A100: '#00ff00', A200: '#00ffff' },
      grey: { '100': '#001100', '200': '#002200', '300': '#004400', '400': '#008800', '500': '#00bb00', '600': '#00ff00' },
      text: { primary: '#00ff00', secondary: '#00bb00' },
      action: { disabledBackground: 'rgba(0,255,0,0.1)', hoverOpacity: 0.1, hover: '#002200' },
      divider: '#004400'
    }
  },
  {
    id: 'zen',
    name: 'Zen',
    avatar: 'Z',
    description: 'Maximum whitespace, hairline borders, near-invisible shadows — calm and meditative',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#e0e0e0', light: '#fafafa', dark: '#b0b0b0' },
      secondary: { main: '#f5f5f5', light: '#ffffff', dark: '#d5d5d5' },
      success: { main: '#a8d8b9', light: '#f0f9f4', dark: '#7ba087', contrastText: '#ffffff' },
      info: { main: '#b0c4de', light: '#f4f8fb', dark: '#8aa0bb', contrastText: '#ffffff' },
      error: { main: '#e6b8b8', light: '#f9f0f0', dark: '#b87b7b', contrastText: '#ffffff' },
      warning: { main: '#f3e3b3', light: '#fdf9f0', dark: '#c5ab78', contrastText: '#ffffff' },
      purple: { A50: '#fafafa', A100: '#eeeeee', A200: '#e0e0e0' },
      grey: { '100': '#fafafa', '200': '#f5f5f5', '300': '#eeeeee', '400': '#cccccc', '500': '#999999', '600': '#666666' },
      text: { primary: '#444444', secondary: '#888888' },
      action: { disabledBackground: 'rgba(0,0,0,0.03)', hoverOpacity: 0.01, hover: '#fbfbfb' },
      divider: '#eeeeee'
    }
  },
  {
    id: 'same',
    name: 'Same',
    avatar: 'S',
    description: 'Smae theme but look like new fresh',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#35d472', light: '#ECF2E6', dark: '#1a8c40' },
      secondary: { main: '#56d687', light: '#E8F7E6', dark: '#36a04c' },
      success: { main: '#22a454', light: '#56d687', dark: '#1a8c40', contrastText: '#ffffff' },
      info: { main: '#539BFF', light: '#EBF3FE', dark: '#1682d4', contrastText: '#ffffff' },
      error: { main: '#FA896B', light: '#FDEDE8', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#FFAE1F', light: '#FEF5E5', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#EBF3FE', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#F2F6FA', '200': '#EAEFF4', '300': '#DFE5EF', '400': '#7C8FAC', '500': '#5A6A85', '600': '#2A3547' },
      text: { primary: '#111f0f', secondary: '#5A6A85' },
      action: { disabledBackground: 'rgba(73,82,88,0.12)', hoverOpacity: 0.02, hover: '#f6f9fc' },
      divider: '#e5eaef'
    }
  },
  {
    id: 'dark-ocean',
    name: 'dark Ocean',
    avatar: 'D',
    description: 'Bluish design with ocean feel',
    updated: '17/03/2026',
    colors: {
      primary: { main: '#0083b0', light: '#e1f5fe', dark: '#005670' },
      secondary: { main: '#00b4db', light: '#e0f7fa', dark: '#007ca8' },
      success: { main: '#2ecc71', light: '#e8f8f0', dark: '#27ae60', contrastText: '#ffffff' },
      info: { main: '#3498db', light: '#ebf5fb', dark: '#2980b9', contrastText: '#ffffff' },
      error: { main: '#e74c3c', light: '#fdeae8', dark: '#c0392b', contrastText: '#ffffff' },
      warning: { main: '#f1c40f', light: '#fef9e7', dark: '#d35400', contrastText: '#ffffff' },
      purple: { A50: '#e1f5fe', A100: '#0083b0', A200: '#00b4db' },
      grey: { '100': '#f4f6f8', '200': '#eef2f5', '300': '#e1e7ec', '400': '#7c98ac', '500': '#5a7885', '600': '#2a3c47' },
      text: { primary: '#0c1b24', secondary: '#5a7585' },
      action: { disabledBackground: 'rgba(0,0,0,0.08)', hoverOpacity: 0.02, hover: '#f0f7fa' },
      divider: '#d8e5ed'
    }
  },
  {
    id: 'wa-midnight',
    name: 'WA Midnight',
    avatar: 'W',
    description: 'Dark mode first — WhatsApp green on deep navy-black backgrounds, easy on the eyes for long sessions',
    updated: '28/03/2026',
    colors: {
      primary: { main: '#075e54', light: '#0d1b1a', dark: '#033b35' },
      secondary: { main: '#128c7e', light: '#0f2422', dark: '#09574e' },
      success: { main: '#25d366', light: '#143c22', dark: '#1aa84f', contrastText: '#ffffff' },
      info: { main: '#34b7f1', light: '#112b36', dark: '#1b8fc2', contrastText: '#ffffff' },
      error: { main: '#fa896b', light: '#331b15', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#ffae1f', light: '#332915', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#1c1236', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#0b141a', '200': '#111b21', '300': '#202c33', '400': '#687781', '500': '#8696a0', '600': '#d1d7db' },
      text: { primary: '#e9edef', secondary: '#8696a0' },
      action: { disabledBackground: 'rgba(255,255,255,0.08)', hoverOpacity: 0.08, hover: '#202c33' },
      divider: '#222e35'
    }
  },
  {
    id: 'wa-new',
    name: 'WA New',
    avatar: 'W',
    description: 'Dark mode first — WhatsApp green on deep navy-black backgrounds, easy on the eyes for long sessions',
    updated: '28/03/2026',
    colors: {
      primary: { main: '#25d366', light: '#0d2d15', dark: '#1aa84f' },
      secondary: { main: '#075e54', light: '#0a2311', dark: '#033b35' },
      success: { main: '#25d366', light: '#143c22', dark: '#1aa84f', contrastText: '#ffffff' },
      info: { main: '#34b7f1', light: '#112b36', dark: '#1b8fc2', contrastText: '#ffffff' },
      error: { main: '#fa896b', light: '#331b15', dark: '#f3704d', contrastText: '#ffffff' },
      warning: { main: '#ffae1f', light: '#332915', dark: '#ae8e59', contrastText: '#ffffff' },
      purple: { A50: '#1c1236', A100: '#6610f2', A200: '#557fb9' },
      grey: { '100': '#0b141a', '200': '#111b21', '300': '#202c33', '400': '#687781', '500': '#8696a0', '600': '#d1d7db' },
      text: { primary: '#e9edef', secondary: '#8696a0' },
      action: { disabledBackground: 'rgba(255,255,255,0.08)', hoverOpacity: 0.08, hover: '#202c33' },
      divider: '#222e35'
    }
  }
]

function getThemeAvatarStyle(themeId) {
  switch (themeId) {
    case 'default':
      return { background: 'linear-gradient(135deg, #35d472 0%, #1a8c40 100%)', color: '#fff' }
    case 'sunset':
      return { background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', color: '#fff' }
    case 'forest':
      return { background: 'linear-gradient(135deg, #2d5a27 0%, #1e3d1a 100%)', color: '#fff' }
    case 'violet':
      return { background: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)', color: '#fff' }
    case 'sharp':
      return { background: '#000000', border: '2px solid #fff', color: '#fff' }
    case 'bubbly':
      return { background: 'linear-gradient(135deg, #ff4081 0%, #00e5ff 100%)', color: '#fff' }
    case 'glass':
      return { background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#333', backdropFilter: 'blur(4px)' }
    case 'editorial':
      return { background: '#fff', border: '2px solid #000', color: '#000', fontFamily: 'serif' }
    case 'cyber':
      return { background: '#000', border: '1.5px solid #00ff00', color: '#00ff00', textShadow: '0 0 4px #00ff00', fontFamily: 'monospace' }
    case 'zen':
      return { background: '#f5f5f5', border: '1px solid #e0e0e0', color: '#666' }
    case 'same':
      return { background: 'linear-gradient(135deg, #35d472 0%, #56d687 100%)', color: '#fff' }
    case 'dark-ocean':
      return { background: 'linear-gradient(135deg, #0083b0 0%, #00b4db 100%)', color: '#fff' }
    case 'wa-midnight':
      return { background: 'linear-gradient(135deg, #0b141a 0%, #075e54 100%)', color: '#25d366' }
    case 'wa-new':
      return { background: 'linear-gradient(135deg, #25d366 0%, #075e54 100%)', color: '#fff' }
    default:
      return { background: 'linear-gradient(135deg, #7c8fac 0%, #5a6a85 100%)', color: '#fff' }
  }
}


const paymentDefaults = {
  pay_offline_id: '',
  pay_offline_key: '',
  offline_active: 0,
  pay_stripe_id: '',
  pay_stripe_key: '',
  stripe_active: 0,
  pay_paypal_id: '',
  pay_paypal_key: '',
  paypal_active: 0,
  rz_id: '',
  rz_key: '',
  rz_active: 0,
  pay_paystack_id: '',
  pay_paystack_key: '',
  paystack_active: 0,
  pay_mercadopago_id: '',
  pay_mercadopago_key: '',
  mercadopago_active: 0,
}

const webDefaults = {
  logo: '',
  app_name: 'B1G CRM',
  custom_home: '',
  is_custom_home: 0,
  meta_description: '',
  currency_code: 'USD',
  currency_symbol: '$',
  home_page_tutorial: '',
  chatbot_screen_tutorial: '',
  broadcast_screen_tutorial: '',
  login_header_footer: '',
  exchange_rate: 1,
}

const socialDefaults = {
  google_client_id: '',
  google_login_active: 0,
  fb_login_app_id: '',
  fb_login_app_sec: '',
  fb_login_active: 0,
}

const deploymentDefaults = {
  meta_app_id: '',
  meta_app_secret: '',
  meta_waba_id: '',
  meta_business_account_id: '',
  meta_access_token: '',
  meta_phone_number_id: '',
  insta_app_id: '',
  insta_app_secret: '',
  insta_business_account_id: '',
  insta_access_token: '',
  ai_provider_active: 'openai',
  ai_openai_key: '',
  ai_openai_model: 'gpt-4o-mini',
  ai_gemini_key: '',
  ai_gemini_model: 'gemini-1.5-flash',
  ai_claude_key: '',
  ai_claude_model: 'claude-3-5-sonnet-20240620',
  ai_openrouter_key: '',
  ai_openrouter_model: '',
  ai_ollama_url: 'http://localhost:11434/v1/chat/completions',
  ai_ollama_model: '',
  ai_custom_url: '',
  ai_custom_model: '',
  widget_domains: '',
}

function AdminSettingsPage() {
  const { tokens } = useAuth()
  const [activeTab, setActiveTab] = useState('Web')
  const [status, setStatus] = useState('Loading settings...')
  const [web, setWeb] = useState(webDefaults)
  const [payments, setPayments] = useState(paymentDefaults)
  const [smtp, setSmtp] = useState({ email: '', host: '', port: 587, password: '' })
  const [social, setSocial] = useState(socialDefaults)
  const [deployment, setDeployment] = useState(deploymentDefaults)
  const [faqs, setFaqs] = useState([])
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' })
  const [testimonials, setTestimonials] = useState([])
  const [testimonialForm, setTestimonialForm] = useState({
    title: '',
    description: '',
    reviewer_name: '',
    reviewer_position: '',
  })
  const [terms, setTerms] = useState({ title: 'Terms and Conditions', content: '' })
  const [privacy, setPrivacy] = useState({ title: 'Privacy Policy', content: '' })
  const [leads, setLeads] = useState([])

  // Theme, Translation & Update States
  const [theme, setTheme] = useState(null)
  const [themesList, setThemesList] = useState([])
  const [editingTheme, setEditingTheme] = useState(null)
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false)
  const [newThemeForm, setNewThemeForm] = useState({ name: '', description: '', baseThemeId: 'default' })
  
  const [langs, setLangs] = useState([])
  const [selectedLang, setSelectedLang] = useState('')
  const [editingLang, setEditingLang] = useState(null)
  const [langData, setLangData] = useState(null)
  const [newLangName, setNewLangName] = useState('')
  const [showAddLangModal, setShowAddLangModal] = useState(false)
  const [langSearch, setLangSearch] = useState('')
  const [editedLangData, setEditedLangData] = useState({})
  const [langPage, setLangPage] = useState(1)
  const [defaultLang, setDefaultLang] = useState(localStorage.getItem('b1gcrm-default-lang') || 'English')

  const [appVersion, setAppVersion] = useState('5.9.5')
  const [showDeployForm, setShowDeployForm] = useState(false)
  const [updatePassword, setUpdatePassword] = useState('')
  const [updateQueries, setUpdateQueries] = useState('')
  const [updateNewQueries, setUpdateNewQueries] = useState('')
  const [updateFile, setUpdateFile] = useState(null)

  // Auto detect tab based on URL path
  useEffect(() => {
    const path = window.location.pathname
    if (path.endsWith('/web-theme')) {
      setActiveTab('Theme')
    } else if (path.endsWith('/translation')) {
      setActiveTab('Translation')
    } else if (path.endsWith('/update-web')) {
      setActiveTab('Update Web')
    }
  }, [])

  const loadTheme = useCallback(async () => {
    try {
      const res = await apiRequest('/api/web/get_theme', { token: tokens.admin })
      if (res?.success) {
        setTheme(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [tokens.admin])

  const loadLangs = useCallback(async () => {
    try {
      const res = await apiRequest('/api/web/get-all-translation-name', { token: tokens.admin })
      if (res?.success && Array.isArray(res.data)) {
        const cleanNames = res.data.map(name => name.replace('.json', ''))
        setLangs(cleanNames)
        if (cleanNames.length > 0 && !selectedLang) {
          setSelectedLang(cleanNames[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [tokens.admin, selectedLang])

  const loadOneLang = useCallback(async (code) => {
    if (!code) return
    setStatus(`Loading translation for ${code}...`)
    try {
      const res = await apiRequest(`/api/web/get-one-translation?code=${code}`, { token: tokens.admin })
      if (res?.success) {
        setLangData(res.data)
        setEditedLangData(res.data || {})
        setLangPage(1)
        setStatus('')
      } else {
        setStatus(res?.msg || `Unable to load translation for ${code}`)
      }
    } catch (e) {
      setStatus(e.message)
    }
  }, [tokens.admin])

  // Load themes list on mount
  useEffect(() => {
    const localThemes = localStorage.getItem('b1gcrm-custom-themes')
    if (localThemes) {
      try {
        setThemesList(JSON.parse(localThemes))
      } catch (e) {
        setThemesList(defaultThemes)
      }
    } else {
      setThemesList(defaultThemes)
      localStorage.setItem('b1gcrm-custom-themes', JSON.stringify(defaultThemes))
    }
  }, [])

  const activeThemeId = useMemo(() => {
    if (!theme?.primary?.main) return 'default'
    const match = themesList.find(
      (t) => t.colors?.primary?.main?.toLowerCase() === theme.primary.main.toLowerCase()
    )
    return match ? match.id : 'custom'
  }, [theme, themesList])

  useEffect(() => {
    async function loadVersion() {
      try {
        const res = await apiRequest('/api/web/get_app_version')
        if (res?.success && res.version) {
          setAppVersion(res.version)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadVersion()
  }, [])

  useEffect(() => {
    if (activeTab === 'Theme' && !theme) {
      loadTheme()
    } else if (activeTab === 'Translation') {
      loadLangs()
    }
  }, [activeTab, theme, loadTheme, loadLangs])

  useEffect(() => {
    if (selectedLang) {
      loadOneLang(selectedLang)
    }
  }, [selectedLang, loadOneLang])

  function handleThemeChange(key, subKey, val) {
    setTheme(prev => {
      if (subKey) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: val
          }
        }
      } else {
        return {
          ...prev,
          [key]: val
        }
      }
    })
  }

  async function saveTheme(event) {
    event.preventDefault()
    setStatus('Saving theme settings...')
    try {
      const result = await apiRequest('/api/web/save_theme', {
        method: 'POST',
        token: tokens.admin,
        body: { updatedJson: theme },
      })
      if (result?.success) {
        setStatus('Theme updated successfully.')
      } else {
        setStatus(result?.msg || 'Unable to update theme')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  const filteredKeys = useMemo(() => {
    if (!editedLangData) return []
    const allKeys = Object.keys(editedLangData)
    if (!langSearch) return allKeys
    const q = langSearch.toLowerCase()
    return allKeys.filter(k =>
      k.toLowerCase().includes(q) ||
      String(editedLangData[k] || '').toLowerCase().includes(q)
    )
  }, [editedLangData, langSearch])

  const langPageSize = 50
  const totalPages = Math.ceil(filteredKeys.length / langPageSize) || 1
  const paginatedKeys = useMemo(() => {
    const start = (langPage - 1) * langPageSize
    return filteredKeys.slice(start, start + langPageSize)
  }, [filteredKeys, langPage])

  function handleLangValueChange(key, val) {
    setEditedLangData(prev => ({
      ...prev,
      [key]: val
    }))
  }

  async function saveTranslation(event) {
    event.preventDefault()
    setStatus('Saving translation...')
    try {
      const result = await apiRequest('/api/web/update-one-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { code: selectedLang, updatedjson: editedLangData },
      })
      if (result?.success) {
        setStatus(result.msg || 'Translation saved.')
      } else {
        setStatus(result?.msg || 'Unable to save translation')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function addLanguage(event) {
    event.preventDefault()
    if (!newLangName.trim()) return
    setStatus('Adding new language...')
    try {
      const result = await apiRequest('/api/web/add-new-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { newcode: newLangName.trim() },
      })
      if (result?.success) {
        setStatus(result.msg || 'Language added.')
        setNewLangName('')
        loadLangs()
      } else {
        setStatus(result?.msg || 'Unable to add language')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function deleteLanguage(code) {
    if (!window.confirm(`Are you sure you want to delete ${code} language?`)) return
    setStatus(`Deleting ${code}...`)
    try {
      const result = await apiRequest('/api/web/del-one-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { code },
      })
      if (result?.success) {
        setStatus(result.msg || 'Language deleted.')
        setSelectedLang('')
        loadLangs()
      } else {
        setStatus(result?.msg || 'Unable to delete language')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  function handleCreateTheme(event) {
    event.preventDefault()
    if (!newThemeForm.name.trim()) return
    const id = newThemeForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const baseTheme = themesList.find(t => t.id === newThemeForm.baseThemeId) || defaultThemes[0]
    
    const newTheme = {
      id,
      name: newThemeForm.name.trim(),
      avatar: newThemeForm.name.trim().charAt(0).toUpperCase(),
      description: newThemeForm.description.trim() || 'Custom user defined theme template',
      updated: new Date().toLocaleDateString('en-GB'),
      colors: JSON.parse(JSON.stringify(baseTheme.colors))
    }
    
    const updatedList = [...themesList, newTheme]
    setThemesList(updatedList)
    localStorage.setItem('b1gcrm-custom-themes', JSON.stringify(updatedList))
    setShowCreateThemeModal(false)
    setNewThemeForm({ name: '', description: '', baseThemeId: 'default' })
    setStatus(`Theme "${newTheme.name}" created successfully.`)
  }

  async function handleSetActiveTheme(t) {
    setStatus(`Applying theme "${t.name}"...`)
    try {
      const result = await apiRequest('/api/web/save_theme', {
        method: 'POST',
        token: tokens.admin,
        body: { updatedJson: t.colors },
      })
      if (result?.success) {
        setTheme(t.colors)
        setStatus(`Theme "${t.name}" is now active.`)
      } else {
        setStatus(result?.msg || `Unable to set "${t.name}" active`)
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  function handleEditThemeColorChange(key, subKey, val) {
    setEditingTheme(prev => {
      const updatedColors = { ...prev.colors }
      if (subKey) {
        updatedColors[key] = { ...updatedColors[key], [subKey]: val }
      } else {
        updatedColors[key] = val
      }
      return { ...prev, colors: updatedColors }
    })
  }

  async function saveEditedTheme(event) {
    event.preventDefault()
    setStatus('Saving theme changes...')
    
    const updatedList = themesList.map(t => t.id === editingTheme.id ? editingTheme : t)
    setThemesList(updatedList)
    localStorage.setItem('b1gcrm-custom-themes', JSON.stringify(updatedList))
    
    try {
      const result = await apiRequest('/api/web/save_theme', {
        method: 'POST',
        token: tokens.admin,
        body: { updatedJson: editingTheme.colors },
      })
      if (result?.success) {
        setTheme(editingTheme.colors)
        setStatus(`Theme "${editingTheme.name}" saved and applied successfully.`)
      } else {
        setStatus(result?.msg || 'Theme updated locally, but unable to sync with backend')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  function handleSetDefaultLang(langCode) {
    localStorage.setItem('b1gcrm-default-lang', langCode)
    window.dispatchEvent(new Event('local-lang-change'))
    setDefaultLang(langCode)
    setStatus(`"${langCode}" set as default language.`)
  }

  async function handleUpdateApp(event) {
    event.preventDefault()
    if (!updatePassword) {
      setStatus('Admin password is required.')
      return
    }
    setStatus('Updating application codebase...')
    try {
      const formData = new FormData()
      formData.append('password', updatePassword)
      if (updateFile) {
        formData.append('file', updateFile)
      }
      if (updateQueries) {
        formData.append('queries', updateQueries)
      }
      if (updateNewQueries) {
        formData.append('newQueries', updateNewQueries)
      }

      const res = await fetch('/api/web/update_app', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.admin}` },
        body: formData,
      })
      const result = await res.json()
      if (result?.success) {
        setStatus(result.msg || 'App updated successfully.')
        setUpdatePassword('')
        setUpdateFile(null)
      } else {
        setStatus(result?.msg || 'Unable to update app')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  const loadSettings = useCallback(async () => {
    setStatus('Loading settings...')
    try {
      const [
        webResult,
        paymentResult,
        smtpResult,
        faqResult,
        testiResult,
        leadResult,
        socialResult,
        termsResult,
        privacyResult,
      ] = await Promise.all([
        apiRequest('/api/admin/get_web_public', { token: tokens.admin }),
        apiRequest('/api/admin/get_payment_gateway_admin', { token: tokens.admin }),
        apiRequest('/api/admin/get_smtp', { token: tokens.admin }),
        apiRequest('/api/admin/get_faq', { token: tokens.admin }),
        apiRequest('/api/admin/get_testi', { token: tokens.admin }),
        apiRequest('/api/admin/get_contact_leads', { token: tokens.admin }),
        apiRequest('/api/admin/get_social_login', { token: tokens.admin }),
        apiRequest('/api/admin/get_page_slug', {
          method: 'POST',
          token: tokens.admin,
          body: { slug: 'terms-and-conditions' },
        }),
        apiRequest('/api/admin/get_page_slug', {
          method: 'POST',
          token: tokens.admin,
          body: { slug: 'privacy-policy' },
        }),
      ])

      setWeb({ ...webDefaults, ...(webResult?.data || {}) })
      setPayments({ ...paymentDefaults, ...(paymentResult?.data || {}) })
      setDeployment({ ...deploymentDefaults, ...(paymentResult?.data || {}) })
      setSmtp({ email: '', host: '', port: 587, password: '', ...(smtpResult?.data || {}) })
      setSocial({ ...socialDefaults, ...(socialResult?.data || {}) })
      setFaqs(Array.isArray(faqResult?.data) ? faqResult.data : [])
      setTestimonials(Array.isArray(testiResult?.data) ? testiResult.data : [])
      setLeads(Array.isArray(leadResult?.data) ? leadResult.data : [])
      if (termsResult?.data?.title) {
        setTerms({ title: termsResult.data.title, content: termsResult.data.content || '' })
      }
      if (privacyResult?.data?.title) {
        setPrivacy({ title: privacyResult.data.title, content: privacyResult.data.content || '' })
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load settings')
    }
  }, [tokens.admin])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function saveJson(path, body, message) {
    setStatus(message || 'Saving...')
    try {
      const result = await apiRequest(path, {
        method: 'POST',
        token: tokens.admin,
        body,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save')
        return false
      }

      setStatus(result.msg || 'Saved.')
      return true
    } catch (error) {
      setStatus(error.message || 'Unable to save')
      return false
    }
  }

  async function addFaq(event) {
    event.preventDefault()
    if (await saveJson('/api/admin/add_faq', faqForm, 'Adding FAQ...')) {
      setFaqForm({ question: '', answer: '' })
      loadSettings()
    }
  }

  async function addTestimonial(event) {
    event.preventDefault()
    if (await saveJson('/api/admin/add_testimonial', testimonialForm, 'Adding testimonial...')) {
      setTestimonialForm({ title: '', description: '', reviewer_name: '', reviewer_position: '' })
      loadSettings()
    }
  }

  async function deleteItem(path, body) {
    if (await saveJson(path, body, 'Deleting...')) {
      loadSettings()
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">admin settings</span>
          <h2>SaaS configuration workspace</h2>
          <p>Manage the operational settings already exposed by the backend.</p>
        </div>
      </div>

      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {activeTab === 'Web' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/web/update_web_config', web, 'Saving public web settings...')
          }}
        >
          <div className="panel-header">
            <h2>Public web settings</h2>
          </div>
          <div className="form-grid">
            {[
              ['app_name', 'App name'],
              ['logo', 'Logo filename'],
              ['currency_code', 'Currency code'],
              ['currency_symbol', 'Currency symbol'],
              ['exchange_rate', 'Exchange rate'],
              ['meta_description', 'Meta description'],
              ['home_page_tutorial', 'Home tutorial URL'],
              ['chatbot_screen_tutorial', 'Chatbot tutorial URL'],
              ['broadcast_screen_tutorial', 'Broadcast tutorial URL'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input value={web[key] || ''} onChange={(event) => setWeb({ ...web, [key]: event.target.value })} />
              </label>
            ))}
          </div>
          <label>
            Custom home HTML/content
            <textarea
              rows={6}
              value={web.custom_home || ''}
              onChange={(event) => setWeb({ ...web, custom_home: event.target.value })}
            />
          </label>
          <label>
            Login header/footer content
            <textarea
              rows={4}
              value={web.login_header_footer || ''}
              onChange={(event) => setWeb({ ...web, login_header_footer: event.target.value })}
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={Number(web.is_custom_home) > 0}
              type="checkbox"
              onChange={(event) => setWeb({ ...web, is_custom_home: event.target.checked ? 1 : 0 })}
            />
            <span>Use custom home</span>
          </label>
          <button className="primary-button" type="submit">
            Save web settings
          </button>
        </form>
      ) : null}

      {activeTab === 'Payments' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_pay_gateway', payments, 'Saving payment gateways...')
          }}
        >
          <div className="panel-header">
            <h2>Payment gateways</h2>
          </div>
          <div className="form-grid">
            {Object.keys(paymentDefaults)
              .filter((key) => !key.endsWith('_active'))
              .map((key) => (
                <label key={key}>
                  {key.replaceAll('_', ' ')}
                  <input
                    value={payments[key] || ''}
                    onChange={(event) => setPayments({ ...payments, [key]: event.target.value })}
                  />
                </label>
              ))}
          </div>
          <div className="action-row">
            {['offline_active', 'stripe_active', 'paypal_active', 'rz_active', 'paystack_active', 'mercadopago_active'].map((key) => (
              <label className="checkbox-row" key={key}>
                <input
                  checked={Number(payments[key]) > 0}
                  type="checkbox"
                  onChange={(event) => setPayments({ ...payments, [key]: event.target.checked ? 1 : 0 })}
                />
                <span>{key.replace('_active', '')}</span>
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save gateways
          </button>
        </form>
      ) : null}

      {activeTab === 'SMTP' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_smtp', smtp, 'Saving SMTP...')
          }}
        >
          <div className="panel-header">
            <h2>SMTP settings</h2>
          </div>
          <div className="form-grid">
            {['email', 'host', 'port', 'password'].map((key) => (
              <label key={key}>
                {key}
                <input
                  type={key === 'password' ? 'password' : 'text'}
                  value={smtp[key] || ''}
                  onChange={(event) => setSmtp({ ...smtp, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save SMTP
          </button>
        </form>
      ) : null}

      {activeTab === 'CMS' ? (
        <div className="page-stack">
          <div className="two-column-grid">
            <form className="panel form-panel" onSubmit={addFaq}>
              <div className="panel-header">
                <h2>FAQ</h2>
              </div>
              <label>
                Question
                <input
                  value={faqForm.question}
                  onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })}
                />
              </label>
              <label>
                Answer
                <textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">
                Add FAQ
              </button>
            </form>

            <form className="panel form-panel" onSubmit={addTestimonial}>
              <div className="panel-header">
                <h2>Testimonial</h2>
              </div>
              {Object.keys(testimonialForm).map((key) => (
                <label key={key}>
                  {key.replaceAll('_', ' ')}
                  <input
                    value={testimonialForm[key]}
                    onChange={(event) =>
                      setTestimonialForm({ ...testimonialForm, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
              <button className="primary-button" type="submit">
                Add testimonial
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <form
              className="panel form-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveJson('/api/admin/update_terms', terms, 'Saving terms...')
              }}
            >
              <div className="panel-header">
                <h2>Terms</h2>
              </div>
              <input value={terms.title} onChange={(event) => setTerms({ ...terms, title: event.target.value })} />
              <textarea
                rows={8}
                value={terms.content}
                onChange={(event) => setTerms({ ...terms, content: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Save terms
              </button>
            </form>

            <form
              className="panel form-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveJson('/api/admin/update_privacy_policy', privacy, 'Saving privacy policy...')
              }}
            >
              <div className="panel-header">
                <h2>Privacy policy</h2>
              </div>
              <input value={privacy.title} onChange={(event) => setPrivacy({ ...privacy, title: event.target.value })} />
              <textarea
                rows={8}
                value={privacy.content}
                onChange={(event) => setPrivacy({ ...privacy, content: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Save privacy policy
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <div className="panel table-panel">
              <div className="panel-header">
                <h2>FAQ list</h2>
              </div>
              <table>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>{faq.question}</td>
                      <td>
                        <button
                          className="mini-button subtle-danger"
                          type="button"
                          onClick={() => deleteItem('/api/admin/del_faq', { id: faq.id })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel table-panel">
              <div className="panel-header">
                <h2>Testimonials</h2>
              </div>
              <table>
                <tbody>
                  {testimonials.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.reviewer_name}</td>
                      <td>
                        <button
                          className="mini-button subtle-danger"
                          type="button"
                          onClick={() => deleteItem('/api/admin/del_testi', { id: item.id })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'Leads' ? (
        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Contact leads</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.mobile}</td>
                  <td>{formatDateTime(lead.createdat || lead.created_at)}</td>
                  <td>
                    <button
                      className="mini-button subtle-danger"
                      type="button"
                      onClick={() => deleteItem('/api/admin/del_cotact_entry', { id: lead.id })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === 'Social' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_social_login', social, 'Saving social login...')
          }}
        >
          <div className="panel-header">
            <h2>Social login</h2>
          </div>
          <div className="form-grid">
            {['google_client_id', 'fb_login_app_id', 'fb_login_app_sec'].map((key) => (
              <label key={key}>
                {key.replaceAll('_', ' ')}
                <input
                  value={social[key] || ''}
                  onChange={(event) => setSocial({ ...social, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="action-row">
            {['google_login_active', 'fb_login_active'].map((key) => (
              <label className="checkbox-row" key={key}>
                <input
                  checked={Number(social[key]) > 0}
                  type="checkbox"
                  onChange={(event) => setSocial({ ...social, [key]: event.target.checked ? 1 : 0 })}
                />
                <span>{key.replaceAll('_', ' ')}</span>
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save social login
          </button>
        </form>
      ) : null}
      {activeTab === 'Deployment' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_deployment_settings', deployment, 'Saving deployment settings...')
          }}
        >
          <div className="panel-header">
            <h2>Third-Party Integration settings</h2>
            <p>Configure global fallbacks for Meta, Instagram, AI Providers, and Website Widgets.</p>
          </div>
          
          <h3 style={{ marginTop: '16px', color: '#1ea085' }}>Meta WhatsApp API (Global Fallback)</h3>
          <div className="form-grid">
            {[
              ['meta_waba_id', 'WhatsApp Business Account ID (WABA ID)'],
              ['meta_business_account_id', 'Meta Business Account ID'],
              ['meta_phone_number_id', 'Business Phone Number ID'],
              ['meta_app_id', 'Meta App ID'],
              ['meta_app_secret', 'Meta App Secret'],
              ['meta_access_token', 'Meta Access Token'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('secret') || key.includes('token') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Instagram Messaging API (Global Fallback)</h3>
          <div className="form-grid">
            {[
              ['insta_business_account_id', 'Instagram Business Account ID'],
              ['insta_app_id', 'Instagram App ID'],
              ['insta_app_secret', 'Instagram App Secret'],
              ['insta_access_token', 'Instagram Access Token'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('secret') || key.includes('token') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Global Fallback AI Autopilot Provider</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label>
              Active AI Provider
              <select
                value={deployment.ai_provider_active}
                onChange={(event) => setDeployment({ ...deployment, ai_provider_active: event.target.value })}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </label>
          </div>
          
          <div className="form-grid" style={{ marginTop: '12px' }}>
            {[
              ['ai_openai_key', 'OpenAI API Key'],
              ['ai_openai_model', 'OpenAI Model (e.g. gpt-4o-mini)'],
              ['ai_gemini_key', 'Gemini API Key'],
              ['ai_gemini_model', 'Gemini Model (e.g. gemini-1.5-flash)'],
              ['ai_claude_key', 'Claude API Key'],
              ['ai_claude_model', 'Claude Model (e.g. claude-3-5-sonnet-20240620)'],
              ['ai_openrouter_key', 'OpenRouter API Key'],
              ['ai_openrouter_model', 'OpenRouter Model'],
              ['ai_ollama_url', 'Ollama Endpoint URL'],
              ['ai_ollama_model', 'Ollama Model'],
              ['ai_custom_url', 'Custom API Endpoint URL'],
              ['ai_custom_model', 'Custom Model Name'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('key') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Global Website Widgets & Domains</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label>
              Allowed Widget Domains (comma-separated list, e.g. "example.com, mycrm.com")
              <input
                value={deployment.widget_domains || ''}
                onChange={(event) => setDeployment({ ...deployment, widget_domains: event.target.value })}
                placeholder="example.com, mycrm.com"
              />
            </label>
          </div>

          <button className="primary-button" type="submit" style={{ marginTop: '24px' }}>
            Save Deployment Configuration
          </button>
        </form>
      ) : null}

      {activeTab === 'Theme' && theme && editingTheme ? (
        <form className="panel form-panel" onSubmit={saveEditedTheme}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div>
              <span className="eyebrow">Theme Customizer</span>
              <h2>Editing Theme: {editingTheme.name}</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditingTheme(null)}
              style={{ padding: '8px 16px' }}
            >
              ◀ Back to Themes
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
            {Object.entries(editingTheme.colors).map(([key, val]) => {
              if (typeof val === 'object' && val !== null) {
                return (
                  <div key={key} className="theme-group-panel" style={{ border: '1px solid rgba(10,25,37,0.06)', borderRadius: '12px', padding: '16px', background: '#fcfcfc' }}>
                    <h3 style={{ textTransform: 'capitalize', color: '#1ea085', margin: '0 0 12px 0', fontSize: '0.95rem' }}>{key} Colors</h3>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                      {Object.entries(val).map(([subKey, subVal]) => {
                        const isColor = String(subVal).startsWith('#')
                        return (
                          <label key={subKey} style={{ display: 'grid', gap: '6px' }}>
                            <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 600, color: '#365261' }}>{subKey}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type={isColor ? 'color' : 'text'}
                                value={subVal || ''}
                                onChange={e => handleEditThemeColorChange(key, subKey, e.target.value)}
                                style={{ padding: isColor ? '0' : '8px 12px', height: isColor ? '38px' : 'auto', width: isColor ? '50px' : '100%', border: '1px solid #c5d0d6', borderRadius: '8px', cursor: isColor ? 'pointer' : 'text' }}
                              />
                              {!isColor ? null : (
                                <input
                                  type="text"
                                  value={subVal || ''}
                                  onChange={e => handleEditThemeColorChange(key, subKey, e.target.value)}
                                  style={{ padding: '8px 12px', border: '1px solid #c5d0d6', borderRadius: '8px', width: '90px', fontSize: '0.85rem' }}
                                />
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              } else {
                return (
                  <label key={key} style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 600, color: '#365261' }}>{key}</span>
                    <input
                      type="text"
                      value={val || ''}
                      onChange={e => handleEditThemeColorChange(key, null, e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #c5d0d6', borderRadius: '8px' }}
                    />
                  </label>
                )
              }
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditingTheme(null)}
              style={{ flexGrow: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              style={{ flexGrow: 2 }}
            >
              Save Theme Colors & Apply
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === 'Theme' && theme && !editingTheme ? (
        <div className="panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div>
              <h2>Theme Manager</h2>
              <p>Create, manage and apply themes across your application</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateThemeModal(true)}
            >
              ➕ Create New Theme
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {themesList.map((t) => {
              const isActive = activeThemeId === t.id
              const avatarStyle = getThemeAvatarStyle(t.id)
              return (
                <div key={t.id} className="panel" style={{
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '2px solid #25d366' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isActive ? '0 8px 24px rgba(37,211,102,0.12)' : '0 4px 12px rgba(0,0,0,0.03)',
                  background: '#fff',
                  position: 'relative'
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#25d366',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Active
                    </div>
                  )}
                  {t.protected && !isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#e2e8f0',
                      color: '#64748b',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      Protected
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      flexShrink: 0,
                      ...avatarStyle
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{t.name}</h3>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Updated: {t.updated}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5, flexGrow: 1 }}>{t.description}</p>
                  <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto' }}>
                    {!isActive && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleSetActiveTheme(t)}
                        style={{ padding: '8px 12px', fontSize: '13px', flexGrow: 1 }}
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setEditingTheme(JSON.parse(JSON.stringify(t)))}
                      style={{ padding: '8px 12px', fontSize: '13px', flexGrow: isActive ? 1 : 0 }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {showCreateThemeModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <form onSubmit={handleCreateTheme} className="panel form-panel" style={{
                width: '100%',
                maxWidth: '480px',
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                background: '#fff',
                padding: '24px'
              }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2>Create New Theme</h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateThemeModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    &times;
                  </button>
                </div>
                
                <div style={{ display: 'grid', gap: '14px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    Theme Name
                    <input
                      value={newThemeForm.name}
                      onChange={e => setNewThemeForm({ ...newThemeForm, name: e.target.value })}
                      placeholder="e.g. Lavender Dream"
                      required
                      style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c5d0d6' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    Description
                    <input
                      value={newThemeForm.description}
                      onChange={e => setNewThemeForm({ ...newThemeForm, description: e.target.value })}
                      placeholder="e.g. Pastel purple and teal accents"
                      style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c5d0d6' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    Base colors on template
                    <select
                      value={newThemeForm.baseThemeId}
                      onChange={e => setNewThemeForm({ ...newThemeForm, baseThemeId: e.target.value })}
                      style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c5d0d6' }}
                    >
                      {themesList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowCreateThemeModal(false)}
                    style={{ flexGrow: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    style={{ flexGrow: 1 }}
                  >
                    Create Theme
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'Translation' && !editingLang ? (
        <div className="panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div>
              <h2>Web Translation</h2>
              <p>Manage your application's language translations</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddLangModal(true)}
            >
              ➕ Add New Language
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {langs.map((l) => {
              const isDefault = defaultLang === l
              return (
                <div key={l} className="panel" style={{
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isDefault ? '2px solid #25d366' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  background: '#fff',
                  position: 'relative'
                }}>
                  {isDefault && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#25d366',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      DEFAULT
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#64748b'
                    }}>
                      🌐
                    </div>
                    <div>
                      <h3 style={{ margin: '0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>{l}</h3>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Language Code: {l.toLowerCase().slice(0,3)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                    {!isDefault && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleSetDefaultLang(l)}
                        style={{ padding: '6px 10px', fontSize: '12px', flexGrow: 1 }}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setSelectedLang(l)
                        setEditingLang(l)
                      }}
                      style={{ padding: '6px 10px', fontSize: '12px', flexGrow: isDefault ? 1 : 0 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button subtle-danger"
                      onClick={() => deleteLanguage(l)}
                      style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {showAddLangModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                addLanguage(e);
                setShowAddLangModal(false);
              }} className="panel form-panel" style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                background: '#fff',
                padding: '24px'
              }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2>Add New Language</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddLangModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    &times;
                  </button>
                </div>
                
                <label style={{ display: 'grid', gap: '6px' }}>
                  Language Name / Code
                  <input
                    value={newLangName}
                    onChange={e => setNewLangName(e.target.value)}
                    placeholder="e.g. Spanish"
                    required
                    style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c5d0d6' }}
                  />
                </label>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowAddLangModal(false)}
                    style={{ flexGrow: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    style={{ flexGrow: 1 }}
                  >
                    Add Language
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'Translation' && editingLang && langData ? (
        <form className="panel form-panel" style={{ padding: '24px', borderRadius: '16px' }} onSubmit={saveTranslation}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div>
              <span className="eyebrow">Translation Dictionary</span>
              <h2>Editing {editingLang} Translations</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={langSearch}
                onChange={e => { setLangSearch(e.target.value); setLangPage(1) }}
                placeholder="Search keys or values..."
                style={{ width: '200px', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.12)', fontSize: '13px' }}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingLang(null)}
                style={{ padding: '8px 16px' }}
              >
                ◀ Back to Languages
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '14px', maxHeight: '500px', overflowY: 'auto', paddingRight: '6px', margin: '20px 0' }}>
            {paginatedKeys.map(k => (
              <label key={k} style={{ display: 'grid', gap: '4px', borderBottom: '1px solid rgba(10,25,37,0.04)', paddingBottom: '8px' }}>
                <code style={{ fontSize: '0.78rem', color: '#1ea085', fontWeight: 600 }}>{k}</code>
                <input
                  value={editedLangData[k] || ''}
                  onChange={e => handleLangValueChange(k, e.target.value)}
                  style={{ borderRadius: '10px', padding: '8px 12px', border: '1px solid #c5d0d6', fontSize: '0.88rem' }}
                />
              </label>
            ))}
            {filteredKeys.length === 0 && (
              <p className="empty-state">No matching translation keys found.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,25,37,0.06)', paddingTop: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                className="mini-button"
                disabled={langPage === 1}
                onClick={() => setLangPage(prev => Math.max(1, prev - 1))}
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: '0.85rem', color: '#607481' }}>Page {langPage} of {totalPages}</span>
              <button
                type="button"
                className="mini-button"
                disabled={langPage === totalPages}
                onClick={() => setLangPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next ▶
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditingLang(null)}
              style={{ flexGrow: 1 }}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit" style={{ flexGrow: 2 }}>
              Save Translation Changes
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === 'Update Web' ? (
        <div className="page-stack">
          {/* App Info Panel */}
          <div className="panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h2>App Update</h2>
                <p>Keep your app up to date</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowDeployForm(!showDeployForm)}
              >
                {showDeployForm ? 'Hide Deploy Form' : 'Update Now'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '40px', marginTop: '20px', marginBottom: '20px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Version</span>
                <strong style={{ fontSize: '1.8rem', color: '#0f172a' }}>{appVersion}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Version</span>
                <strong style={{ fontSize: '1.8rem', color: '#1ea085' }}>5.9.9</strong>
              </div>
            </div>

            {showDeployForm && (
              <form className="form-panel" onSubmit={handleUpdateApp} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginTop: '24px' }}>
                <h3 style={{ color: '#0f172a', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Deploy System Update Package</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    Admin Password (Required)
                    <input
                      type="password"
                      value={updatePassword}
                      onChange={e => setUpdatePassword(e.target.value)}
                      placeholder="Enter current admin password"
                      style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c5d0d6' }}
                    />
                  </label>
                  
                  <label style={{ display: 'grid', gap: '6px' }}>
                    Select update zip package
                    <input
                      type="file"
                      accept=".zip"
                      onChange={e => setUpdateFile(e.target.files?.[0] || null)}
                      style={{ border: '1px solid #c5d0d6', borderRadius: '12px', padding: '8px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px' }}>
                    Migration Queries (JSON String Array - Optional)
                    <textarea
                      rows={4}
                      value={updateQueries}
                      onChange={e => setUpdateQueries(e.target.value)}
                      placeholder='e.g. ["CREATE TABLE IF NOT EXISTS test (id SERIAL PRIMARY KEY)"]'
                      style={{ borderRadius: '12px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #c5d0d6' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px' }}>
                    New Schema Assertion Queries (JSON format - Optional)
                    <textarea
                      rows={4}
                      value={updateNewQueries}
                      onChange={e => setUpdateNewQueries(e.target.value)}
                      placeholder='e.g. [{"run": "ALTER TABLE users ADD COLUMN age INT", "check": "SELECT column_name FROM information_schema.columns WHERE table_name = \"users\" AND column_name = \"age\""}]'
                      style={{ borderRadius: '12px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #c5d0d6' }}
                    />
                  </label>
                </div>
                <button className="primary-button" type="submit" style={{ marginTop: '24px', width: '100%' }}>
                  🚀 Deploy Update Package
                </button>
              </form>
            )}
          </div>

          <div className="panel" style={{ padding: '24px', borderRadius: '16px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', margin: '0 0 16px 0' }}>Changelog</h3>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  <span>Version 5.9.9</span>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', padding: '2px 6px', borderRadius: '8px' }}>Latest</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: 'auto' }}>Released 30 May 2026</span>
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>New Ai Chat Provider added [Supports web access, and multi ai model] - UseVelix.com (Ai Plugin)</li>
                  <li>Added new node in flow builder to add or remove phonebook contact from the phonebook</li>
                  <li>Minor bug fixes and improvements</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  <span>Version 5.9.8</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: 'auto' }}>Released 22 May 2026</span>
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>Performance optimizations for background loops and database locking.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  <span>Version 5.9.5</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: 'auto' }}>Released 4 May 2026</span>
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>Integrated secure token credentials database queries and removed hashes.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  <span>Version 5.9.0</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: 'auto' }}>Released 3 Apr 2026</span>
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>Enhanced automation canvas nodes serialization and disk writes.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  <span>Version 5.8.0</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: 'auto' }}>Released 10 Mar 2026</span>
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>Initial release of the visual flow builder canvas interface.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminSettingsPage
