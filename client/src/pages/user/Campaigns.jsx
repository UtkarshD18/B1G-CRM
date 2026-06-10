import PlaceholderModule from '../../components/PlaceholderModule'

function UserCampaignsPage() {
  return (
    <PlaceholderModule
      eyebrow="campaigns"
      title="Broadcast campaign workspace"
      description="Broadcast creation, logs, status changes, and delivery updates are already represented in backend routes and the campaign loop."
      bullets={[
        'Create campaigns through /api/broadcast.',
        'Review campaign logs through /api/broadcast/get_broadcast_logs.',
        'Pause/resume/delete campaigns through broadcast status routes.',
        'Campaign processing runs from loops/campaignLoop.js.',
      ]}
    />
  )
}

export default UserCampaignsPage
