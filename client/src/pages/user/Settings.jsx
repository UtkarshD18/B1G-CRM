import PlaceholderModule from '../../components/PlaceholderModule'

function UserSettingsPage() {
  return (
    <PlaceholderModule
      eyebrow="settings"
      title="Tenant profile and workspace settings"
      description="This named demo-live route groups user profile, plan, API key, widget, and integration settings into one navigation target."
      bullets={[
        'Profile data is available from /api/user/get_me.',
        'Plan and order flows are already implemented under /api/user.',
        'API keys can be created from existing user API key routes.',
        'Chat Widget remains available as a dedicated page.',
      ]}
    />
  )
}

export default UserSettingsPage
