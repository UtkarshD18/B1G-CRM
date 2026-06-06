export default function AdminPlans() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Manage Plans</h1>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Pricing Plans</h3>
          <button className="btn btn-primary">Add Plan</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-600">
              <tr>
                <th className="pb-3 font-semibold">Plan Name</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Users</th>
                <th className="pb-3 font-semibold">Subscribers</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Starter", price: "$9.99/mo", users: "1", subs: 234 },
                {
                  name: "Professional",
                  price: "$29.99/mo",
                  users: "5",
                  subs: 456,
                },
                {
                  name: "Enterprise",
                  price: "$99.99/mo",
                  users: "Unlimited",
                  subs: 89,
                },
              ].map((plan, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-700 hover:bg-dark-card transition-colors"
                >
                  <td className="py-3">{plan.name}</td>
                  <td className="py-3">{plan.price}</td>
                  <td className="py-3">{plan.users}</td>
                  <td className="py-3">{plan.subs}</td>
                  <td className="py-3 space-x-2">
                    <button className="text-primary-500 hover:text-primary-400">
                      Edit
                    </button>
                    <button className="text-red-500 hover:text-red-400">
                      Delete
                    </button>
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
