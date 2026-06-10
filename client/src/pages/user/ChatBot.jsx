import PlaceholderModule from '../../components/PlaceholderModule'

function UserChatBotPage() {
  return (
    <PlaceholderModule
      eyebrow="chatbot"
      title="Chatbot and flow automation"
      description="demo-live separates ChatBot as a named module. In local main, this is backed by automation flows plus chatbot routes."
      bullets={[
        'Build and edit flows in Automation Flows.',
        'Create chatbot records through /api/chatbot.',
        'Flow runtime state is handled through flow_data and helper/chatbot modules.',
        'Recommended next step: add a visual bot list connected to /api/chatbot/get.',
      ]}
    />
  )
}

export default UserChatBotPage
