export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Manage Users</h1>
      <div className="card">
        <input
          type="text"
          placeholder="Search users..."
          className="input mb-4"
        />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-dark-card rounded-lg"
            >
              <div>
                <p className="font-medium">User {i}</p>
                <p className="text-gray-400 text-sm">user{i}@example.com</p>
              </div>
              <div className="space-x-2">
                <button className="text-primary-500">View</button>
                <button className="text-red-500">Ban</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
