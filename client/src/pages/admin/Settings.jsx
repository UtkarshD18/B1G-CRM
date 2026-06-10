import PlaceholderModule from '../../components/PlaceholderModule'

function AdminSettingsPage() {
  return (
    <PlaceholderModule
      eyebrow="admin settings"
      title="SaaS configuration checklist"
      description="demo-live exposes a dedicated settings area. The current backend already stores payment, SMTP, branding, pages, and social-login settings through admin routes."
      bullets={[
        'Payment gateway settings are available through existing admin payment routes.',
        'SMTP and email recovery settings are available through existing admin SMTP routes.',
        'Branding, RTL, public web configuration, pages, FAQs, partners, and testimonials are existing backend modules.',
        'Next step for production polish: split these backend capabilities into focused settings forms.',
      ]}
    />
  )
}

export default AdminSettingsPage
