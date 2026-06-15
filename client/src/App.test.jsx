import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import App from './App.jsx'
import { ADMIN_REFERENCE_ROUTES, USER_REFERENCE_ROUTES } from './routes/AppRoutes.jsx'

const mockSocketHandlers = {}
const mockSocketEmit = jest.fn((event, payload) => {
  if (event === 'get_chat' || event === 'get_chat_filter') {
    setTimeout(() => {
      mockSocketHandlers.get_chat?.([
        {
          chat_id: 'chat-open',
          sender_name: 'Jordan Buyer',
          sender_mobile: '+15550001111',
          chat_status: 'open',
          last_message: 'Need a quote',
          last_message_came: 1760000000,
          origin: 'meta',
        },
      ])
    }, 0)
  }

  if (event === 'on_open_chat') {
    setTimeout(() => {
      mockSocketHandlers.on_open_chat?.({
        chatinfo: payload?.data?.chat,
        conversation: [
          {
            type: 'text',
            route: 'INCOMING',
            senderName: 'Jordan Buyer',
            timestamp: 1760000000,
            msgContext: {
              text: {
                body: 'Hello from customer',
              },
            },
          },
        ],
        chatnote: 'High priority buyer',
        labelsAdded: [{ id: 1, title: 'VIP' }],
        agentData: [{ uid: 'agent-1', name: 'Sales Agent', email: 'agent@example.com' }],
        chatAssignAgent: {},
      })
    }, 0)
  }
})

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn((event, handler) => {
      mockSocketHandlers[event] = handler
      if (event === 'connect') {
        setTimeout(handler, 0)
      }
    }),
    emit: mockSocketEmit,
    disconnect: jest.fn(),
  })),
}))

function jsonResponse(body) {
  return {
    json: async () => body,
  }
}

function createToken(uid, role) {
  return `header.${window.btoa(JSON.stringify({ uid, role }))}.signature`
}

function setAuthToken(role) {
  window.localStorage.setItem(
    'b1gcrm-auth',
    JSON.stringify({
      admin: role === 'admin' ? createToken('admin-1', 'admin') : '',
      user: role === 'user' ? createToken('user-1', 'user') : '',
      agent: role === 'agent' ? createToken('agent-1', 'agent') : '',
    }),
  )
}

function mockApiResponses() {
  global.fetch = jest.fn(async (input) => {
    const url = String(input)

    if (url.endsWith('/api/user/get_me')) {
      return jsonResponse({
        success: true,
        data: {
          uid: 'user-1',
          name: 'Acme Operations',
          email: 'ops@example.com',
          api_key: 'api-test-key',
          plan: JSON.stringify({ title: 'Premium', allow_api: 1 }),
          plan_expire: '2027-01-01T00:00:00.000Z',
          trial: 0,
        },
      })
    }

    if (url.includes('/api/user/get_payment_details')) {
      return jsonResponse({
        success: true,
        data: {
          stripe_active: 1,
          pay_stripe_id: 'pk_test_123',
          paypal_active: 0,
          rz_active: 0,
          paystack_active: 0,
          offline_active: 1,
        },
        userData: {
          uid: 'user-1',
          name: 'Acme Operations',
          plan: JSON.stringify({ title: 'Premium', allow_api: 1 }),
          plan_expire: '2027-01-01T00:00:00.000Z',
          trial: 0,
        },
      })
    }

    if (url.includes('/api/admin/get_plans')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            title: 'Trial',
            price: 0,
            is_trial: 1,
            plan_duration_in_days: 10,
            short_description: 'Evaluation plan',
          },
          {
            id: 2,
            title: 'Premium',
            price: 149,
            is_trial: 0,
            plan_duration_in_days: 365,
            short_description: 'Production plan',
          },
        ],
      })
    }

    if (url.includes('/api/user/get_my_meta_templets')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 'template-1',
            name: 'order_update',
            status: 'APPROVED',
            category: 'UTILITY',
            language: 'en_US',
            components: [
              {
                type: 'BODY',
                text: 'Hello {{1}}, your order {{2}} is ready.',
              },
            ],
          },
          {
            id: 'template-2',
            name: 'draft_offer',
            status: 'PENDING',
            category: 'MARKETING',
            language: 'en_US',
            components: [
              {
                type: 'BODY',
                text: 'Hi {{1}}, here is your offer.',
              },
            ],
          },
        ],
      })
    }

    if (url.includes('/api/user/add_meta_templet')) {
      return jsonResponse({
        success: true,
        msg: 'Template submitted for Meta review.',
      })
    }

    if (url.includes('/api/user/get_meta_keys')) {
      return jsonResponse({
        success: true,
        data: {
          waba_id: 'waba-123',
          business_account_id: 'business-123',
          business_phone_number_id: 'phone-123',
          app_id: 'app-123',
          access_token: 'mock-meta-access-token',
        },
      })
    }

    if (url.includes('/api/user/update_meta')) {
      return jsonResponse({
        success: true,
        msg: 'Your meta settings were updated successfully!',
      })
    }

    if (url.includes('/api/qr/get_all')) {
      return jsonResponse({
        success: true,
        data: [
          {
            title: 'Support QR',
            uniqueId: 'support-qr',
            status: 'CONNECTED',
          },
        ],
      })
    }

    if (url.includes('/api/chatbot/get_logs')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 10,
            chatbot_title: 'Lead qualification bot',
            flow_id: 'flow-sales',
            sender_name: 'Jordan Buyer',
            sender_number: '+15550001111',
            incoming_message: 'pricing',
            status: 'matched',
            matched: 1,
            detail: JSON.stringify({ reply_count: 2 }),
            created_at: '2026-06-11T08:00:00.000Z',
          },
        ],
      })
    }

    if (url.includes('/api/chatbot/get_chatbot')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            title: 'Lead qualification bot',
            for_all: 1,
            active: 1,
            flow_id: 'flow-sales',
            flow: JSON.stringify({ id: 7, flow_id: 'flow-sales', title: 'Sales intake' }),
            chats: JSON.stringify([]),
            origin: JSON.stringify({ title: 'Meta', code: 'META', data: {} }),
          },
        ],
      })
    }

    if (url.includes('/api/chatbot/add_chatbot')) {
      return jsonResponse({
        success: true,
        msg: 'Chatbot was added',
      })
    }

    if (url.includes('/api/chatbot/change_bot_status') || url.includes('/api/chatbot/del_chatbot')) {
      return jsonResponse({
        success: true,
        msg: 'Chatbot was updated',
      })
    }

    if (url.includes('/api/chat_flow/get_mine')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 7,
            flow_id: 'flow-sales',
            title: 'Sales intake',
          },
        ],
      })
    }

    if (url.includes('/api/chat_flow/get_by_flow_id')) {
      return jsonResponse({
        success: true,
        nodes: [],
        edges: [],
      })
    }

    if (url.includes('/api/chat_flow/get_activity')) {
      return jsonResponse({
        success: true,
        prevent: [],
        ai: [],
      })
    }

    if (url.includes('/api/chat_flow/add_new')) {
      return jsonResponse({
        success: true,
        msg: 'Flow was saved',
      })
    }

    if (url.includes('/api/broadcast/dashboard_summary')) {
      return jsonResponse({
        success: true,
        data: {
          campaignStatus: {
            total: 2,
            queued: 1,
            paused: 1,
            completed: 0,
            scheduled: 1,
          },
          delivery: {
            total: 4,
            pending: 1,
            sent: 1,
            delivered: 1,
            read: 1,
            failed: 1,
          },
          trend: [
            { label: 'Jun 05', value: 0 },
            { label: 'Jun 06', value: 1 },
            { label: 'Jun 07', value: 3 },
          ],
          templates: [
            { label: 'order_update', value: 3 },
            { label: 'winback_offer', value: 1 },
          ],
        },
      })
    }

    if (url.includes('/api/broadcast/get_broadcast_logs')) {
      return jsonResponse({
        success: true,
        totalLogs: 4,
        totalPending: 1,
        getSent: 1,
        totalDelivered: 1,
        totalRead: 1,
        totalFailed: 1,
        data: [
          {
            id: 1,
            send_to: '+15550001111',
            delivery_status: 'delivered',
            templet_name: 'order_update',
            err: '',
          },
          {
            id: 2,
            send_to: '+15550002222',
            delivery_status: 'failed',
            templet_name: 'order_update',
            err: 'Invalid recipient',
          },
        ],
      })
    }

    if (url.includes('/api/broadcast/add_new')) {
      return jsonResponse({
        success: true,
        msg: 'Your broadcast has been added',
      })
    }

    if (url.includes('/api/broadcast/get_broadcast')) {
      return jsonResponse({
        success: true,
        data: [
          {
            broadcast_id: 'broadcast-1',
            title: 'Seasonal promo',
            templet: JSON.stringify({ name: 'order_update' }),
            phonebook: JSON.stringify({ name: 'Customers' }),
            status: 'QUEUE',
            schedule: '2027-01-01T00:00:00.000Z',
          },
          {
            broadcast_id: 'broadcast-2',
            title: 'Paused winback',
            templet: JSON.stringify({ name: 'winback_offer' }),
            phonebook: JSON.stringify({ name: 'Leads' }),
            status: 'PAUSED',
            schedule: '2025-01-01T00:00:00.000Z',
          },
        ],
      })
    }

    if (url.includes('/api/phonebook/get_by_uid')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            name: 'Customers',
            contact_count: 2,
          },
        ],
      })
    }

    if (url.includes('/api/user/return_media_url')) {
      return jsonResponse({
        success: true,
        url: 'http://localhost:3010/media/test-image.png',
      })
    }

    if (url.includes('/api/user/get_my_widget')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            unique_id: 'widget-test-1',
            title: 'Storefront support',
            whatsapp_number: '+15550003333',
            logo: 'whatsapp-widget.svg',
            place: 'BOTTOM_RIGHT',
            size: 64,
          },
        ],
      })
    }

    if (url.includes('/api/user/add_widget')) {
      return jsonResponse({
        success: true,
        msg: 'Widget was added',
      })
    }

    if (url.includes('/api/inbox/get_chats')) {
      return jsonResponse({
        success: true,
        data: [
          {
            chat_id: 'chat-open',
            sender_name: 'Jordan Buyer',
            sender_mobile: '+15550001111',
            chat_status: 'open',
            last_message: 'Need a quote',
            last_message_came: 1760000000,
          },
          {
            chat_id: 'chat-pending',
            sender_name: 'Priya Ops',
            sender_mobile: '+15550002222',
            chat_status: 'pending',
            last_message: 'Waiting on invoice',
            last_message_came: 1760000100,
          },
        ],
      })
    }

    return jsonResponse({ success: true, data: [] })
  })
}

async function renderAtRoute(route, { role } = {}) {
  window.history.pushState({}, '', route)
  window.localStorage.clear()
  if (role) {
    setAuthToken(role)
  }

  await act(async () => {
    render(<App />)
  })
}

describe('App routing shell', () => {
  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((key) => {
      delete mockSocketHandlers[key]
    })
    mockSocketEmit.mockClear()
    mockApiResponses()
  })

  test('renders the public marketing site at the root path', async () => {
    await renderAtRoute('/')

    expect(await screen.findByText('Public site, tenant workspace, staff portal, and admin controls in one product.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  test('renders the admin sign in page', async () => {
    await renderAtRoute('/admin/login')

    expect(await screen.findByText('Admin Sign In')).toBeInTheDocument()
  })

  test('renders the user sign in page', async () => {
    await renderAtRoute('/user/login')

    expect(await screen.findByText('User Sign In')).toBeInTheDocument()
  })

  test('renders the agent sign in page', async () => {
    await renderAtRoute('/agent/login')

    expect(await screen.findByText('Agent Sign In')).toBeInTheDocument()
  })

  test('protects user SaaS pages without a user token', async () => {
    await renderAtRoute('/user/billing')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/user/login')
    })
    expect(await screen.findByText('User Sign In')).toBeInTheDocument()
  })

  test('renders the billing page with mocked plan and gateway data', async () => {
    await renderAtRoute('/user/billing', { role: 'user' })

    expect(await screen.findByText('Plans, trial, and checkout')).toBeInTheDocument()
    expect(await screen.findByText('Payment gateways')).toBeInTheDocument()
    expect(await screen.findByText('Premium')).toBeInTheDocument()
  })

  test('renders the API and webhook dashboard with mocked tenant data', async () => {
    await renderAtRoute('/user/api-dashboard', { role: 'user' })

    expect(await screen.findByText('REST API, template API, and webhook setup')).toBeInTheDocument()
    expect(await screen.findByText('Webhook endpoint')).toBeInTheDocument()
    expect(await screen.findByText(/\/api\/v1\/send-message/)).toBeInTheDocument()
  })

  test('renders focused Meta WhatsApp linking and saves verified credentials', async () => {
    await renderAtRoute('/user/link-meta-whatsapp', { role: 'user' })

    expect(await screen.findByText('Link Meta WhatsApp')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('waba-123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('phone-123')).toBeInTheDocument()
    expect(screen.getByText('Connected workflows')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Business phone number ID'), {
      target: { value: 'phone-999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save and verify Meta' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/update_meta'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"business_phone_number_id":"phone-999"'),
        }),
      )
    })
    expect(await screen.findByText('Meta credentials verified and saved.')).toBeInTheDocument()
  })

  test('renders the Meta template builder from the audited reference slug', async () => {
    await renderAtRoute('/user/create-meta-template', { role: 'user' })

    expect(await screen.findByText('Create Meta Template')).toBeInTheDocument()
    expect(await screen.findByText('Template request')).toBeInTheDocument()
    expect(await screen.findByText('Header type')).toBeInTheDocument()
    expect(await screen.findByText('Variable examples')).toBeInTheDocument()
    expect(screen.getByLabelText('Body {{1}} example')).toHaveValue('Customer')
    expect(screen.getByText('Template buttons')).toBeInTheDocument()
    expect(await screen.findByText('order_update')).toBeInTheDocument()
    expect(await screen.findByText('Submit to Meta')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Template name'), {
      target: { value: 'shipping_update' },
    })
    fireEvent.change(screen.getByLabelText('Body {{1}} example'), {
      target: { value: 'Jordan' },
    })
    fireEvent.change(screen.getByLabelText('Button 1 type'), {
      target: { value: 'URL' },
    })
    fireEvent.change(screen.getByLabelText('Button 1 text'), {
      target: { value: 'Track shipment' },
    })
    fireEvent.change(screen.getByLabelText('Button 1 URL'), {
      target: { value: 'https://example.com/track/{{1}}' },
    })
    fireEvent.change(screen.getByLabelText('Button 1 URL {{1}} example'), {
      target: { value: 'https://example.com/track/JORDAN' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit to Meta' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/add_meta_templet'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"body_text":[["Jordan"]]'),
        }),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/add_meta_templet'),
      expect.objectContaining({
        body: expect.stringContaining('"type":"URL","text":"Track shipment","url":"https://example.com/track/{{1}}","example":["https://example.com/track/JORDAN"]'),
      }),
    )
  })

  test('renders the WhatsApp-style inbox and opens a socket conversation', async () => {
    await renderAtRoute('/user/inbox', { role: 'user' })

    expect(await screen.findByText('Omnichannel operator inbox')).toBeInTheDocument()
    const chatRow = await screen.findByText('Jordan Buyer')
    fireEvent.click(chatRow)

    expect(await screen.findByText('Hello from customer')).toBeInTheDocument()
    expect(await screen.findByText('Conversation context')).toBeInTheDocument()
    expect(await screen.findByPlaceholderText('Type a WhatsApp reply')).toBeInTheDocument()
  })

  test('uploads and emits an inbox media reply through the socket composer', async () => {
    await renderAtRoute('/user/inbox', { role: 'user' })

    const chatRow = await screen.findByText('Jordan Buyer')
    fireEvent.click(chatRow)
    expect(await screen.findByText('Hello from customer')).toBeInTheDocument()

    const file = new File(['image-bytes'], 'quote.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Media file'), {
      target: { files: [file] },
    })
    fireEvent.change(screen.getByLabelText('Media caption'), {
      target: { value: 'Updated product quote' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send media' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/return_media_url'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      )
    })

    await waitFor(() => {
      expect(mockSocketEmit).toHaveBeenCalledWith(
        'send_chat_message',
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'image',
            msgCon: expect.objectContaining({
              type: 'image',
              image: expect.objectContaining({
                link: 'http://localhost:3010/media/test-image.png',
                caption: 'Updated product quote',
              }),
            }),
            chatInfo: expect.objectContaining({
              chat_id: 'chat-open',
            }),
          }),
        }),
      )
    })
  })

  test('renders the Kanban pipeline from the audited reference slug', async () => {
    await renderAtRoute('/user/kanban', { role: 'user' })

    expect(await screen.findByText('Chat Kanban')).toBeInTheDocument()
    expect(await screen.findByText('Jordan Buyer')).toBeInTheDocument()
    expect(await screen.findByText('Pending')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/user/kanban')
  })

  test('renders chatbot targeting and creates an all-chat Meta bot', async () => {
    await renderAtRoute('/user/chatbot', { role: 'user' })

    expect(await screen.findByText('Chatbot automation over saved flows')).toBeInTheDocument()
    expect(await screen.findByText('Total bots')).toBeInTheDocument()
    expect((await screen.findAllByText('Lead qualification bot')).length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText('All incoming chats')).toBeInTheDocument()
    expect(await screen.findByText('Recent chatbot diagnostics')).toBeInTheDocument()
    expect(await screen.findByText('pricing')).toBeInTheDocument()
    expect(await screen.findByText('2 replies')).toBeInTheDocument()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chatbot/get_logs?limit=25'),
        expect.any(Object),
      )
    })

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Support intake bot' },
    })
    fireEvent.change(screen.getByLabelText('Flow'), {
      target: { value: 'flow-sales' },
    })
    fireEvent.click(screen.getByLabelText('Run on every incoming chat'))

    expect(await screen.findByText('This bot will run for every new incoming conversation on the selected origin.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create chatbot' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chatbot/add_chatbot'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Support intake bot"'),
        }),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chatbot/add_chatbot'),
      expect.objectContaining({
        body: expect.stringContaining('"for_all":true'),
      }),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chatbot/add_chatbot'),
      expect.objectContaining({
        body: expect.stringContaining('"chats":[]'),
      }),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chatbot/add_chatbot'),
      expect.objectContaining({
        body: expect.stringContaining('"flow_id":"flow-sales"'),
      }),
    )
    expect(await screen.findByText('Chatbot was added')).toBeInTheDocument()
  })

  test('generates and saves a bot-ready automation flow', async () => {
    await renderAtRoute('/user/automation-flows', { role: 'user' })

    expect(await screen.findByText('Bot-ready flow template')).toBeInTheDocument()
    expect(await screen.findByText('Bot triggers')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Trigger phrase'), {
      target: { value: 'pricing' },
    })
    fireEvent.change(screen.getByLabelText('Reply message'), {
      target: { value: 'Here is the pricing menu.' },
    })
    fireEvent.change(screen.getByLabelText('Fallback reply'), {
      target: { value: 'A team member will respond shortly.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate bot-ready flow' }))

    expect(await screen.findByText('Bot-ready flow draft generated.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nodes JSON').value).toContain('Here is the pricing menu.')
    expect(screen.getByLabelText('Edges JSON').value).toContain('"sourceHandle": "pricing"')

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Pricing auto reply' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save flow' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat_flow/add_new'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Pricing auto reply"'),
        }),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat_flow/add_new'),
      expect.objectContaining({
        body: expect.stringContaining('"sourceHandle":"pricing"'),
      }),
    )
    expect(await screen.findByText('Flow saved.')).toBeInTheDocument()
  })

  test('renders the campaign dashboard and loads delivery analytics', async () => {
    await renderAtRoute('/user/campaign-dashboard', { role: 'user' })

    expect(await screen.findByText('Campaign Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Create broadcast')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcast/dashboard_summary'),
        expect.any(Object),
      )
    })
    fireEvent.change(screen.getByLabelText('From date'), {
      target: { value: '2026-06-01' },
    })
    fireEvent.change(screen.getByLabelText('To date'), {
      target: { value: '2026-06-07' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcast/dashboard_summary?from=2026-06-01&to=2026-06-07'),
        expect.any(Object),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/broadcast/get_broadcast?from=2026-06-01&to=2026-06-07'),
      expect.any(Object),
    )
    expect(await screen.findByText('Aggregate delivery')).toBeInTheDocument()
    expect(await screen.findByText('Delivery trend')).toBeInTheDocument()
    expect(await screen.findByText('Template usage')).toBeInTheDocument()
    expect(await screen.findByText('Jun 07')).toBeInTheDocument()
    expect((await screen.findAllByText('winback_offer')).length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText('Seasonal promo')).toBeInTheDocument()
    expect((await screen.findAllByText('order_update')).length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText('Customers')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Inspect' })[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcast/get_broadcast_logs'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"id":"broadcast-1"'),
        }),
      )
    })
    expect(await screen.findByText('Recipients')).toBeInTheDocument()
    expect(await screen.findByText('+15550001111')).toBeInTheDocument()
    expect(await screen.findByText('Invalid recipient')).toBeInTheDocument()
  })

  test('renders the send campaign composer and submits mapped variables', async () => {
    await renderAtRoute('/user/send-campaign', { role: 'user' })

    expect(await screen.findByRole('heading', { name: 'Send campaign' })).toBeInTheDocument()
    expect(await screen.findByText('Approved templates')).toBeInTheDocument()
    expect(await screen.findByText('Selected audience')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Campaign title'), {
      target: { value: 'January delivery update' },
    })
    fireEvent.change(screen.getByLabelText('Approved Meta template'), {
      target: { value: 'order_update' },
    })

    expect(await screen.findByText('Hello {{1}}, your order {{2}} is ready.')).toBeInTheDocument()
    expect(screen.getByLabelText('Variable 1 contact field')).toHaveValue('{{name}}')
    expect(screen.getByLabelText('Variable 2 contact field')).toHaveValue('{{var1}}')

    fireEvent.change(screen.getByLabelText('Variable 2 contact field'), {
      target: { value: '{{mobile}}' },
    })
    fireEvent.change(screen.getByLabelText('Phonebook'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('Schedule'), {
      target: { value: '2027-01-02T10:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create campaign' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcast/add_new'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"January delivery update"'),
        }),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/broadcast/add_new'),
      expect.objectContaining({
        body: expect.stringContaining('"name":"order_update"'),
      }),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/broadcast/add_new'),
      expect.objectContaining({
        body: expect.stringContaining('"example":["{{name}}","{{mobile}}"]'),
      }),
    )
    expect(await screen.findByText('Campaign created.')).toBeInTheDocument()
  })

  test('renders chat widget embed code and posts backend-compatible placement values', async () => {
    await renderAtRoute('/user/chat-widget', { role: 'user' })

    expect(await screen.findByText('Chat widget workspace')).toBeInTheDocument()
    expect(await screen.findByText('Storefront support')).toBeInTheDocument()
    expect(screen.getAllByText(/widget-test-1/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/<iframe src=/)).toHaveTextContent('bottom:0;right:0;')

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Sales desk' },
    })
    fireEvent.change(screen.getByLabelText('WhatsApp number'), {
      target: { value: '+15550004444' },
    })
    fireEvent.change(screen.getByLabelText('Placement'), {
      target: { value: 'BOTTOM_LEFT' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create widget' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/add_widget'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"place":"BOTTOM_LEFT"'),
        }),
      )
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/add_widget'),
      expect.objectContaining({
        body: expect.stringContaining('"selectedIcon":"whatsapp-widget.svg"'),
      }),
    )
  })

  test('renders a registered planned reference route instead of dropping to the public site', async () => {
    await renderAtRoute('/user/whatsapp-forms', { role: 'user' })

    expect(await screen.findByText('WhatsApp Forms')).toBeInTheDocument()
    expect(await screen.findByText('Implementation readiness')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/user/whatsapp-forms')
  })
})

describe('Reference route inventory', () => {
  test('covers all audited admin slugs from the reference SaaS app', () => {
    const adminPaths = ADMIN_REFERENCE_ROUTES.map((route) => route.path)

    expect(adminPaths).toEqual(
      expect.arrayContaining([
        'dashboard',
        'manage-plans',
        'manage-users',
        'orders',
        'front-partner',
        'faq',
        'manage-page',
        'testimonial',
        'contact-form',
        'wa-link',
        'payment-gateways',
        'flow-builder-template',
        'web-theme',
        'social-login',
        'site-settings',
        'smtp',
        'translation',
        'update-web',
        'qr-plugin-settings',
        'instagram-config',
        'web-notification',
        'send-web-push',
        'embed-config',
        'telegram-config',
      ]),
    )
  })

  test('covers all audited user slugs from the reference SaaS app', () => {
    const userPaths = USER_REFERENCE_ROUTES.map((route) => route.path)

    expect(userPaths).toEqual(
      expect.arrayContaining([
        'dashboard',
        'inbox',
        'kanban',
        'kabnan',
        'whatsapp-forms',
        'link-instagram',
        'insta-dm-bot',
        'insta-comment-dm',
        'add-whatsapp-qr',
        'whatsapp-warmer',
        'rest-api',
        'link-meta-whatsapp',
        'automation-flows',
        'wa-chatbot',
        'create-meta-template',
        'send-campaign',
        'campaign-dashboard',
        'phonebook',
        'create-call-flow',
        'wa-call-logs',
        'setup-wa-calls',
        'conversational-api',
        'template-api',
        'api-dashboard',
        'manage-webhooks',
        'webhook-automation',
        'webhook-logs',
        'telegram-sessions',
        'web-notification',
        'agent-login',
        'agent-task',
        'chat-widget',
      ]),
    )
  })
})
