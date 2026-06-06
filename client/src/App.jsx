import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from './store';

// Import Layout Components
import AppShell from './layouts/AppShell';
import LoginLayout from './layouts/LoginLayout';

// Import Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminPlans from './pages/admin/Plans';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminSettings from './pages/admin/Settings';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserInbox from './pages/user/Inbox';
import UserContacts from './pages/user/Contacts';
import UserCampaigns from './pages/user/Campaigns';
import UserChatBot from './pages/user/ChatBot';
import UserIntegrations from './pages/user/Integrations';
import UserSettings from './pages/user/Settings';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentChats from './pages/agent/Chats';
import AgentTasks from './pages/agent/Tasks';

// Loading component
function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#00A389] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading...</p>
            </div>
        </div>
    );
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children, requiredType = null }) {
    const { isAuthenticated, userType } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredType && userType !== requiredType) {
        return <Navigate to="/" replace />;
    }

    return children;
}

/**
 * Main App Component
 */
function App() {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);
    const [darkMode] = useUIStore((state) => [state.darkMode]);

    // Check authentication on app load
    useEffect(() => {
        const initializeApp = async () => {
            if (isAuthenticated) {
                await checkAuth();
            }
            setIsInitialized(true);
        };

        initializeApp();
    }, []);

    // Apply dark mode class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    return (
        <Router>
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginLayout><LoginPage /></LoginLayout>} />
                <Route path="/register" element={<LoginLayout><RegisterPage /></LoginLayout>} />

                {/* Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute requiredType="admin">
                            <AppShell userType="admin">
                                <Routes>
                                    <Route path="/" element={<AdminDashboard />} />
                                    <Route path="/plans" element={<AdminPlans />} />
                                    <Route path="/users" element={<AdminUsers />} />
                                    <Route path="/orders" element={<AdminOrders />} />
                                    <Route path="/settings" element={<AdminSettings />} />
                                </Routes>
                            </AppShell>
                        </ProtectedRoute>
                    }
                />

                {/* User Routes */}
                <Route
                    path="/user/*"
                    element={
                        <ProtectedRoute requiredType="user">
                            <AppShell userType="user">
                                <Routes>
                                    <Route path="/" element={<UserDashboard />} />
                                    <Route path="/inbox" element={<UserInbox />} />
                                    <Route path="/contacts" element={<UserContacts />} />
                                    <Route path="/campaigns" element={<UserCampaigns />} />
                                    <Route path="/chatbot" element={<UserChatBot />} />
                                    <Route path="/integrations" element={<UserIntegrations />} />
                                    <Route path="/settings" element={<UserSettings />} />
                                </Routes>
                            </AppShell>
                        </ProtectedRoute>
                    }
                />

                {/* Agent Routes */}
                <Route
                    path="/agent/*"
                    element={
                        <ProtectedRoute requiredType="agent">
                            <AppShell userType="agent">
                                <Routes>
                                    <Route path="/" element={<AgentDashboard />} />
                                    <Route path="/chats" element={<AgentChats />} />
                                    <Route path="/tasks" element={<AgentTasks />} />
                                </Routes>
                            </AppShell>
                        </ProtectedRoute>
                    }
                />

                {/* Root redirect */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to={useAuthStore.getState().userType === 'admin' ? '/admin' : useAuthStore.getState().userType === 'agent' ? '/agent' : '/user'} replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
        <Route path="/agent/*" element={<AgentLayout />} />
        <Route path="*" element={<Navigate to="/user/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
