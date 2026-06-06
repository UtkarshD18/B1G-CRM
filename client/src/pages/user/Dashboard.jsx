import { useAuthStore } from "../../store";

export default function UserDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Welcome, {user?.name || "User"}</h1>
        <p className="text-gray-400">Your CRM workspace overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Conversations", value: "24", icon: "💬" },
          { label: "Contacts", value: "1,234", icon: "👥" },
          { label: "Campaign Reach", value: "12,450", icon: "📢" },
          { label: "Response Rate", value: "68%", icon: "📊" },
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
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Messages</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 hover:bg-dark-surface rounded-lg cursor-pointer"
              >
                <p className="font-medium">Contact {i}</p>
                <p className="text-gray-400 text-sm">Hello, how are you?</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Plan Status</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Current Plan</p>
              <p className="text-2xl font-bold">Professional</p>
            </div>
            <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-primary-500"></div>
            </div>
            <p className="text-gray-400 text-sm">3/5 agents used</p>
            <button className="btn btn-primary w-full">Upgrade Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
