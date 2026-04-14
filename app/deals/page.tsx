export default function Deals() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Deal
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["Lead", "Qualified", "Negotiation"].map((stage) => (
          <div key={stage} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">{stage}</h3>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-900">Acme Corp</p>
                <p className="text-sm text-gray-500">$15,000</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-900">TechCo</p>
                <p className="text-sm text-gray-500">$8,500</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}