
import { useState } from "react";
import { Plus, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TransactionList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const transactions = [
    {
      id: 1,
      property: "123 Main St Condo",
      client: "John Smith",
      type: "Sale",
      amount: "$450,000",
      commission: "$13,500",
      status: "Closed",
      date: "2024-05-15",
      agent: "You"
    },
    {
      id: 2,
      property: "456 Oak Ave House",
      client: "Sarah Johnson",
      type: "Sale",
      amount: "$750,000",
      commission: "$22,500",
      status: "Pending",
      date: "2024-06-01",
      agent: "You"
    },
    {
      id: 3,
      property: "789 Pine St Duplex",
      client: "Mike Davis",
      type: "Purchase",
      amount: "$320,000",
      commission: "$9,600",
      status: "In Progress",
      date: "2024-06-10",
      agent: "Jennifer Lee"
    },
    {
      id: 4,
      property: "321 Beach Rd Townhouse",
      client: "Emily Wilson",
      type: "Sale",
      amount: "$595,000",
      commission: "$17,850",
      status: "Pending",
      date: "2024-05-28",
      agent: "You"
    }
  ];

  const filteredTransactions = transactions.filter(transaction =>
    transaction.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Closed": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">Track your sales and purchase transactions</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
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

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{transaction.property}</CardTitle>
                  <CardDescription className="mt-1">
                    {transaction.type} • {transaction.client}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Transaction Amount</div>
                    <div className="text-xl font-bold text-green-600">{transaction.amount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Commission</div>
                    <div className="text-xl font-bold text-blue-600">{transaction.commission}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Agent:</span> {transaction.agent}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No transactions found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransactionList;
