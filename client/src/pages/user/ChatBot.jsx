export default function UserChatBot() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Chatbots</h1>
        <button className="btn btn-primary">Create Chatbot</button>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Your Chatbots</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-gray-700 rounded-lg hover:bg-dark-surface"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Chatbot {i}</p>
                  <p className="text-gray-400 text-sm">
                    Handles customer inquiries automatically
                  </p>
                </div>
                <div className="space-x-2">
                  <span className="badge badge-success">Active</span>
                  <button className="text-primary-500 text-sm">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
