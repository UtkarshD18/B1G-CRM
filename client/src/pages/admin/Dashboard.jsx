import { useAuthStore } from "../../store";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="text-gray-400">
          Manage SaaS platform settings, users, and billing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stats Cards */}
        {[
          { label: "Total Users", value: "1,234", icon: "👥" },
          { label: "Active Plans", value: "856", icon: "💳" },
          { label: "Revenue (Month)", value: "$42,500", icon: "💰" },
          { label: "Support Tickets", value: "23", icon: "🎫" },
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Signups</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium">User {item}</p>
                  <p className="text-gray-400 text-sm">
                    user{item}@example.com
                  </p>
                </div>
                <span className="badge badge-primary">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full btn btn-secondary text-left">
              📊 View Analytics
            </button>
            <button className="w-full btn btn-secondary text-left">
              📝 Manage Plans
            </button>
            <button className="w-full btn btn-secondary text-left">
              👥 Browse Users
            </button>
            <button className="w-full btn btn-secondary text-left">
              💬 Review Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
