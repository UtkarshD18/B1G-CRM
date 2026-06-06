export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-surface flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-500 mb-2">
              B1G CRM
            </h1>
            <p className="text-gray-400">WhatsApp & Omnichannel CRM SaaS</p>
          </div>

          {children}

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              &copy; 2026 B1G CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
