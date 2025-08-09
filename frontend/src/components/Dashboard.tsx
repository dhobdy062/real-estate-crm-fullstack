
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Building, FileText, CheckSquare, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Contacts",
      value: "1,247",
      change: "+12.5%",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Active Leads",
      value: "89",
      change: "+8.2%",
      icon: UserPlus,
      color: "bg-green-500"
    },
    {
      title: "Properties Listed",
      value: "156",
      change: "+3.1%",
      icon: Building,
      color: "bg-purple-500"
    },
    {
      title: "Pending Transactions",
      value: "23",
      change: "-2.4%",
      icon: FileText,
      color: "bg-orange-500"
    },
    {
      title: "Open Tasks",
      value: "42",
      change: "+5.8%",
      icon: CheckSquare,
      color: "bg-red-500"
    },
    {
      title: "Monthly Revenue",
      value: "$45,890",
      change: "+15.3%",
      icon: TrendingUp,
      color: "bg-indigo-500"
    }
  ];

  const recentActivities = [
    {
      action: "New lead created",
      details: "John Smith - Luxury Apartment Inquiry",
      time: "2 minutes ago",
      type: "lead"
    },
    {
      action: "Property listing updated",
      details: "123 Main St - Price reduced to $450,000",
      time: "15 minutes ago",
      type: "property"
    },
    {
      action: "Task completed",
      details: "Follow up call with Sarah Johnson",
      time: "1 hour ago",
      type: "task"
    },
    {
      action: "New contact added",
      details: "Mike Davis - Potential Buyer",
      time: "2 hours ago",
      type: "contact"
    },
    {
      action: "Transaction closed",
      details: "456 Oak Ave - $320,000",
      time: "3 hours ago",
      type: "transaction"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your real estate business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className={`text-xs ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates from your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'lead' ? 'bg-green-500' :
                    activity.type === 'property' ? 'bg-purple-500' :
                    activity.type === 'task' ? 'bg-red-500' :
                    activity.type === 'contact' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <UserPlus className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Add Lead</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
                <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Add Contact</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
                <Building className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">List Property</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center">
                <CheckSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Create Task</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
