// Compatibility aliases: use the same mapping for requested and stored grants.
module.exports = {
  contacts_access: 'contacts.read',
  inbox_access: 'inbox.read',
  kanban_access: 'inbox.read',
  chatbot_access: 'automation.read',
  settings_access: 'settings.users',
  campaigns_access: 'inbox.read',
  flows_access: 'automation.read',
  leads_access: 'contacts.read',
  website_access: 'settings.users',
};
