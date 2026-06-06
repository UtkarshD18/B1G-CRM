export default function AgentChats() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">My Chats</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="card p-0">
            <div className="p-4 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search chats..."
                className="input"
              />
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-dark-surface cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      C{i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Contact {i}</p>
                      <p className="text-gray-400 text-sm truncate">
                        Last message...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card h-96 flex flex-col">
            <div className="border-b border-gray-700 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                  C1
                </div>
                <div>
                  <p className="font-medium text-lg">Contact 1</p>
                  <p className="text-gray-400 text-sm">Online</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs ${i % 2 === 0 ? "bg-primary-500 text-white" : "bg-dark-surface"} px-4 py-2 rounded-lg rounded-tl-none`}
                  >
                    Message {i}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="input flex-1"
              />
              <button className="btn btn-primary">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
