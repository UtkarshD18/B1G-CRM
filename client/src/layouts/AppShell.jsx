import {
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSettings,
  FiSun,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "../store";

export default function AppShell({ children, userType }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, darkMode, toggleTheme } = useUIStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = {
    admin: [
      { label: "Dashboard", path: "/admin", icon: "📊" },
      { label: "Plans", path: "/admin/plans", icon: "💳" },
      { label: "Users", path: "/admin/users", icon: "👥" },
      { label: "Orders", path: "/admin/orders", icon: "📦" },
    ],
    user: [
      { label: "Dashboard", path: "/user", icon: "📊" },
      { label: "Inbox", path: "/user/inbox", icon: "💬" },
      { label: "Contacts", path: "/user/contacts", icon: "👥" },
      { label: "Campaigns", path: "/user/campaigns", icon: "📢" },
      { label: "Chatbot", path: "/user/chatbot", icon: "🤖" },
      { label: "Integrations", path: "/user/integrations", icon: "🔌" },
    ],
    agent: [
      { label: "Dashboard", path: "/agent", icon: "📊" },
      { label: "Chats", path: "/agent/chats", icon: "💬" },
      { label: "Tasks", path: "/agent/tasks", icon: "✅" },
    ],
  };

  const items = menuItems[userType] || [];

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-dark-surface border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-primary-500">B1G CRM</h1>
          ) : (
            <span className="text-2xl">📱</span>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-2">
          {items.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-dark-card rounded-lg transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-gray-700 p-4 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center space-x-2 p-2 hover:bg-dark-card rounded-lg"
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            {sidebarOpen && (
              <span className="text-sm">{darkMode ? "Light" : "Dark"}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-dark-surface border-b border-gray-700 flex items-center justify-between px-6">
          <button
            onClick={toggleSidebar}
            className="text-gray-300 hover:text-white"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user?.email}</span>
            <button className="text-gray-300 hover:text-white">
              <FiSettings size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
