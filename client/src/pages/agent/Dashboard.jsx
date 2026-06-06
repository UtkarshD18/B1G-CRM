import { useAuthStore } from "../../store";

export default function AgentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Your Dashboard</h1>
        <p className="text-gray-400">Assigned chats and tasks overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Assigned Chats", value: "12", icon: "💬" },
          { label: "Pending Tasks", value: "5", icon: "✅" },
          { label: "Response Time", value: "2.3 min", icon: "⏱️" },
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
        {/* Your Chats */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Your Active Chats</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 hover:bg-dark-surface rounded-lg cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Contact {i}</p>
                    <p className="text-gray-400 text-sm">
                      Last message 5 min ago
                    </p>
                  </div>
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Tasks */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Your Tasks</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 border-l-4 border-primary-500 bg-dark-surface rounded-lg"
              >
                <p className="font-medium">Task {i}</p>
                <p className="text-gray-400 text-sm">Due today at 5:00 PM</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
