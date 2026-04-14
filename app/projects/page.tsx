export default function Projects() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">Website Redesign</h3>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Active</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">Acme Corp</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "65%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">65% complete</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">Mobile App</h3>
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Onboarding</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">TechCo</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "20%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">20% complete</p>
        </div>
      </div>
    </div>
  );
}