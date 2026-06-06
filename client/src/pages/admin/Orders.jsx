export default function AdminOrders() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Payment Orders</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-600">
              <tr>
                <th className="pb-3">Order ID</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="py-3">ORD-{i}001</td>
                  <td className="py-3">user{i}@example.com</td>
                  <td className="py-3">$29.99</td>
                  <td className="py-3">Professional</td>
                  <td className="py-3">
                    <span className="badge badge-success">Paid</span>
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
