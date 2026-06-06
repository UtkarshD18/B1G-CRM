export default function UserSettings() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Company Name
              </label>
              <input type="text" value="My Business" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value="owner@business.com"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input type="tel" value="+1 234 567 8900" className="input" />
            </div>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Security</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <input type="password" placeholder="••••••••" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input type="password" placeholder="••••••••" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input type="password" placeholder="••••••••" className="input" />
            </div>
            <button className="btn btn-primary">Update Password</button>
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Billing</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Plan:</span>
              <span className="font-bold">Professional</span>
            </div>
            <div className="flex justify-between">
              <span>Next Billing:</span>
              <span>July 6, 2026</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold">$29.99/month</span>
            </div>
            <button className="btn btn-secondary w-full mt-4">
              View Invoice
            </button>
            <button className="btn btn-primary w-full">Upgrade Plan</button>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label>Email Notifications</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label>Push Notifications</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label>Marketing Emails</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select className="input">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-500/50 bg-red-500/5">
        <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
        <p className="text-gray-400 mb-4">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button className="btn bg-red-500 text-white hover:bg-red-600">
          Delete Account
        </button>
      </div>
    </div>
  );
}
