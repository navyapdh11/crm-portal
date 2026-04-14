export default function Dashboard() {
  const stats = [
    { label: "Contacts", value: "124", change: "+12%" },
    { label: "Active Deals", value: "45", change: "+8%" },
    { label: "Invoices Due", value: "$12,450", change: "-3%" },
    { label: "Projects", value: "18", change: "+5%" },
  ];
  
  const recentActivity = [
    { type: "contact", message: "New contact added: John Smith", time: "2 hours ago" },
    { type: "deal", message: "Deal moved to negotiation: Acme Corp", time: "4 hours ago" },
    { type: "invoice", message: "Invoice #1234 sent to Client Co", time: "1 day ago" },
    { type: "project", message: "Project 'Website Redesign' completed", time: "2 days ago" },
  ];
  
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <span className={`text-xs ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
              {stat.change} from last month
            </span>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === "contact" ? "bg-blue-500" :
                activity.type === "deal" ? "bg-green-500" :
                activity.type === "invoice" ? "bg-yellow-500" : "bg-purple-500"
              }`} />
              <div>
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}