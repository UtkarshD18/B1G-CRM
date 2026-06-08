import { render, screen } from '@testing-library/react'
import { act } from 'react'
import App from './App.jsx'

async function renderAtRoute(route) {
  window.history.pushState({}, '', route)
  window.localStorage.clear()

  await act(async () => {
    render(<App />)
  })
}

describe('App routing shell', () => {
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
})
