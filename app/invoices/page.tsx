export default function Invoices() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Invoice
        </button>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">INV-001</td>
              <td className="px-6 py-4 text-sm text-gray-600">Acme Corp</td>
              <td className="px-6 py-4 text-sm text-gray-600">$5,000</td>
              <td className="px-6 py-4 text-sm text-gray-600">Apr 20, 2026</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Sent</span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">INV-002</td>
              <td className="px-6 py-4 text-sm text-gray-600">TechCo</td>
              <td className="px-6 py-4 text-sm text-gray-600">$3,250</td>
              <td className="px-6 py-4 text-sm text-gray-600">Apr 15, 2026</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Paid</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}