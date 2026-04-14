export default function Contacts() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Contact
        </button>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">John Smith</td>
              <td className="px-6 py-4 text-sm text-gray-600">john@acme.com</td>
              <td className="px-6 py-4 text-sm text-gray-600">Acme Corp</td>
              <td className="px-6 py-4 text-sm text-gray-600">+1 555-0123</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Sarah Johnson</td>
              <td className="px-6 py-4 text-sm text-gray-600">sarah@techco.io</td>
              <td className="px-6 py-4 text-sm text-gray-600">TechCo</td>
              <td className="px-6 py-4 text-sm text-gray-600">+1 555-0456</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}