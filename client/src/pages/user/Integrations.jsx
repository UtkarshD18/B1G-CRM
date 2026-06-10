import PlaceholderModule from '../../components/PlaceholderModule'

function UserIntegrationsPage() {
  return (
    <PlaceholderModule
      eyebrow="integrations"
      title="Meta, QR, API, and webhook integration points"
      description="The backend already includes Meta API settings, QR instances, generated API keys, webhook handling, and public API v1 routes."
      bullets={[
        'Meta WhatsApp credentials are managed by user routes.',
        'QR session instances are managed by /api/qr.',
        'Public API access is exposed through /api/v1.',
        'Webhook and inbox callbacks are handled under /api/inbox.',
      ]}
    />
  )
}

export default UserIntegrationsPage
