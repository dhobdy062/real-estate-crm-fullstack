
import { useState } from "react";
import { Plus, Search, Filter, Mail, Phone, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CommunicationList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const communications = [
    {
      id: 1,
      type: "Email",
      subject: "Property Inquiry - Downtown Condo",
      contact: "John Smith",
      direction: "Incoming",
      status: "Read",
      date: "2024-06-04 10:30 AM",
      preview: "Hi, I'm interested in the downtown condo listing..."
    },
    {
      id: 2,
      type: "Phone",
      subject: "Follow-up Call",
      contact: "Sarah Johnson",
      direction: "Outgoing",
      status: "Completed",
      date: "2024-06-04 2:15 PM",
      preview: "Discussed financing options and next steps"
    },
    {
      id: 3,
      type: "SMS",
      subject: "Showing Confirmation",
      contact: "Mike Davis",
      direction: "Outgoing",
      status: "Sent",
      date: "2024-06-03 4:45 PM",
      preview: "Confirmed property showing for tomorrow at 3 PM"
    },
    {
      id: 4,
      type: "Email",
      subject: "Market Analysis Request",
      contact: "Emily Wilson",
      direction: "Incoming",
      status: "Unread",
      date: "2024-06-03 9:20 AM",
      preview: "Could you provide a market analysis for my neighborhood?"
    },
    {
      id: 5,
      type: "Phone",
      subject: "Pricing Discussion",
      contact: "Robert Kim",
      direction: "Incoming",
      status: "Missed",
      date: "2024-06-02 1:10 PM",
      preview: "Missed call - wants to discuss property pricing"
    }
  ];

  const filteredCommunications = communications.filter(comm =>
    comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Email": return Mail;
      case "Phone": return Phone;
      case "SMS": return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string, direction: string) => {
    if (status === "Unread") return "bg-blue-100 text-blue-800";
    if (status === "Missed") return "bg-red-100 text-red-800";
    if (direction === "Incoming") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-2">Track all interactions with your clients</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Communication
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search communications..."
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

      {/* Communications List */}
      <div className="space-y-3">
        {filteredCommunications.map((comm) => {
          const TypeIcon = getTypeIcon(comm.type);
          return (
            <Card key={comm.id} className={`hover:shadow-md transition-shadow cursor-pointer ${
              comm.status === "Unread" ? 'border-blue-200 bg-blue-50/30' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    comm.type === "Email" ? "bg-blue-100" :
                    comm.type === "Phone" ? "bg-green-100" :
                    "bg-purple-100"
                  }`}>
                    <TypeIcon className={`w-5 h-5 ${
                      comm.type === "Email" ? "text-blue-600" :
                      comm.type === "Phone" ? "text-green-600" :
                      "text-purple-600"
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className={`text-lg ${comm.status === "Unread" ? 'font-bold' : ''}`}>
                        {comm.subject}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(comm.status, comm.direction)}>
                          {comm.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {comm.direction}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardDescription className="mb-2">
                      <strong>{comm.contact}</strong> • {comm.type}
                    </CardDescription>
                    
                    <p className={`text-sm text-gray-600 mb-2 ${comm.status === "Unread" ? 'font-medium' : ''}`}>
                      {comm.preview}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{comm.date}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCommunications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No communications found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunicationList;
