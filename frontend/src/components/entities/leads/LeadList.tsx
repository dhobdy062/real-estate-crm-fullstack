
import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LeadList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const leads = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex.t@email.com",
      phone: "(555) 111-2222",
      source: "Website",
      status: "Hot",
      interest: "Luxury Condo",
      budget: "$500,000 - $750,000",
      created: "2 days ago"
    },
    {
      id: 2,
      name: "Jennifer Lee",
      email: "jen.lee@email.com",
      phone: "(555) 333-4444",
      source: "Referral",
      status: "Warm",
      interest: "Family Home",
      budget: "$300,000 - $450,000",
      created: "1 week ago"
    },
    {
      id: 3,
      name: "Robert Kim",
      email: "rob.kim@email.com",
      phone: "(555) 555-6666",
      source: "Social Media",
      status: "Cold",
      interest: "Investment Property",
      budget: "$200,000 - $300,000",
      created: "3 days ago"
    },
    {
      id: 4,
      name: "Lisa Chen",
      email: "lisa.chen@email.com",
      phone: "(555) 777-8888",
      source: "Google Ads",
      status: "Hot",
      interest: "Townhouse",
      budget: "$400,000 - $600,000",
      created: "1 day ago"
    }
  ];

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.interest.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-red-100 text-red-800";
      case "Warm": return "bg-yellow-100 text-yellow-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-2">Track and manage your sales leads</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search leads..."
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

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lead.name}</CardTitle>
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
              </div>
              <CardDescription>{lead.interest}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Email:</span>
                  <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Phone:</span>
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Budget:</span>
                  <span className="text-xs">{lead.budget}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Source:</span>
                  <Badge variant="outline" className="text-xs">
                    {lead.source}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Created:</span>
                  <span>{lead.created}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No leads found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadList;
