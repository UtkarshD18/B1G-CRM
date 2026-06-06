export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Settings</h1>
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Platform Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Platform Name
            </label>
            <input type="text" value="B1G CRM" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Support Email
            </label>
            <input type="email" value="support@b1gcrm.com" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Max File Size (MB)
            </label>
            <input type="number" value="50" className="input" />
          </div>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
