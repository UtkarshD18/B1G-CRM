export default function UserCampaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Campaigns</h1>
        <button className="btn btn-primary">Create Campaign</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <h3 className="font-bold mb-2">Campaign {i}</h3>
            <p className="text-gray-400 text-sm mb-4">
              Lorem ipsum dolor sit amet
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sent:</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Opened:</span>
                <span className="font-medium text-primary-500">842 (68%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Clicked:</span>
                <span className="font-medium text-green-500">234 (19%)</span>
              </div>
            </div>
            <button className="btn btn-secondary w-full mt-4">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
