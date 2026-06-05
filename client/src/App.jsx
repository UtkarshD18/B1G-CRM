import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AdminLayout = () => (
  <div style={{ background: '#0F172A', color: '#F8FAFC', height: '100vh', padding: '20px' }}>
    <h1>Admin Portal Shell</h1>
    <p>Global SaaS settings, users, and plans.</p>
  </div>
);

const UserLayout = () => (
  <div style={{ background: '#0F172A', color: '#F8FAFC', height: '100vh', padding: '20px' }}>
    <h1>User Portal Shell</h1>
    <p>Tenant workspace: Inbox, flows, and campaigns.</p>
  </div>
);

const AgentLayout = () => (
  <div style={{ background: '#0F172A', color: '#F8FAFC', height: '100vh', padding: '20px' }}>
    <h1>Agent Portal Shell</h1>
    <p>Restricted access workspace for assigned chats.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/user/login" />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/user/*" element={<UserLayout />} />
        <Route path="/agent/*" element={<AgentLayout />} />
        <Route path="*" element={<Navigate to="/user/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
