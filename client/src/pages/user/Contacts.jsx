export default function UserContacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Contacts</h1>
        <button className="btn btn-primary">Add Contact</button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search contacts..."
          className="input mb-4"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-600">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Conversations</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr
                  key={i}
                  className="border-b border-gray-700 hover:bg-dark-card"
                >
                  <td className="py-3">Contact {i}</td>
                  <td className="py-3">+1 234 567 {1000 + i}</td>
                  <td className="py-3">contact{i}@example.com</td>
                  <td className="py-3">{Math.floor(Math.random() * 20)}</td>
                  <td className="py-3 space-x-2">
                    <button className="text-primary-500 text-sm">View</button>
                    <button className="text-red-500 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
