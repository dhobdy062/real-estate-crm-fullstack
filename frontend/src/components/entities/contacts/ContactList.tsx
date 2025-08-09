
import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ContactList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const contacts = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      company: "ABC Corp",
      status: "Active",
      type: "Buyer",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 987-6543",
      company: "XYZ Ltd",
      status: "Active",
      type: "Seller",
      lastContact: "1 week ago"
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike.davis@email.com",
      phone: "(555) 456-7890",
      company: "Tech Solutions",
      status: "Inactive",
      type: "Investor",
      lastContact: "2 weeks ago"
    },
    {
      id: 4,
      name: "Emily Wilson",
      email: "emily.w@email.com",
      phone: "(555) 321-0987",
      company: "Marketing Plus",
      status: "Active",
      type: "Buyer",
      lastContact: "3 days ago"
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-2">Manage your client contacts and relationships</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
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

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{contact.name}</CardTitle>
                <Badge variant={contact.status === "Active" ? "default" : "secondary"}>
                  {contact.status}
                </Badge>
              </div>
              <CardDescription>{contact.company}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Email:</span>
                  <span>{contact.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Phone:</span>
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {contact.type}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-16">Last:</span>
                  <span>{contact.lastContact}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No contacts found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactList;
