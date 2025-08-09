
import { useState } from "react";
import { Plus, Search, Filter, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const TaskList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const tasks = [
    {
      id: 1,
      title: "Follow up with John Smith",
      description: "Discuss financing options for downtown condo",
      priority: "High",
      status: "Pending",
      dueDate: "2024-06-05",
      assignee: "You",
      category: "Follow-up",
      completed: false
    },
    {
      id: 2,
      title: "Schedule property showing",
      description: "456 Oak Ave for Sarah Johnson",
      priority: "Medium",
      status: "In Progress",
      dueDate: "2024-06-03",
      assignee: "Jennifer Lee",
      category: "Showing",
      completed: false
    },
    {
      id: 3,
      title: "Prepare listing photos",
      description: "Professional photos for 789 Pine St",
      priority: "Low",
      status: "Completed",
      dueDate: "2024-06-01",
      assignee: "Mike Davis",
      category: "Marketing",
      completed: true
    },
    {
      id: 4,
      title: "Review purchase agreement",
      description: "Legal review for Beach Rd townhouse",
      priority: "High",
      status: "Pending",
      dueDate: "2024-06-06",
      assignee: "You",
      category: "Legal",
      completed: false
    }
  ];

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !tasks.find(t => t.dueDate === dueDate)?.completed;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">Manage your daily tasks and activities</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`hover:shadow-md transition-shadow cursor-pointer ${
            task.completed ? 'bg-gray-50' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardDescription className={`mb-3 ${task.completed ? 'text-gray-400' : ''}`}>
                    {task.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {isOverdue(task.dueDate) && (
                          <Badge variant="destructive" className="text-xs ml-1">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{task.assignee}</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No tasks found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
