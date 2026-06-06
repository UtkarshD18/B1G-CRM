export default function UserIntegrations() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Integrations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Keys */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">API Keys</h3>
            <button className="btn btn-primary btn-sm">Generate Key</button>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
              >
                <div>
                  <p className="font-medium">API Key {i}</p>
                  <p className="text-gray-400 text-sm">sk_live_***{1000 + i}</p>
                </div>
                <button className="text-red-500 text-sm">Revoke</button>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Webhooks</h3>
            <button className="btn btn-primary btn-sm">Add Webhook</button>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
              >
                <div>
                  <p className="font-medium">Webhook {i}</p>
                  <p className="text-gray-400 text-sm">
                    https://example.com/webhook
                  </p>
                </div>
                <button className="text-red-500 text-sm">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Services */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Connected Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "WhatsApp", connected: true },
            { name: "Instagram", connected: false },
            { name: "Telegram", connected: false },
            { name: "Email", connected: true },
            { name: "Shopify", connected: false },
            { name: "Stripe", connected: true },
          ].map((service, idx) => (
            <div
              key={idx}
              className="p-4 border border-gray-700 rounded-lg text-center"
            >
              <p className="font-medium mb-2">{service.name}</p>
              <button
                className={`text-sm ${service.connected ? "text-green-500" : "text-gray-400"}`}
              >
                {service.connected ? "✓ Connected" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
