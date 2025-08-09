
import { useState } from "react";
import { Plus, Search, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PropertyList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const properties = [
    {
      id: 1,
      title: "Modern Downtown Condo",
      address: "123 Main St, City Center",
      price: "$450,000",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      status: "For Sale",
      type: "Condo",
      listed: "1 week ago"
    },
    {
      id: 2,
      title: "Luxury Family Home",
      address: "456 Oak Ave, Suburb",
      price: "$750,000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      status: "Sold",
      type: "House",
      listed: "2 weeks ago"
    },
    {
      id: 3,
      title: "Investment Duplex",
      address: "789 Pine St, Eastside",
      price: "$320,000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      status: "For Sale",
      type: "Duplex",
      listed: "3 days ago"
    },
    {
      id: 4,
      title: "Waterfront Townhouse",
      address: "321 Beach Rd, Waterfront",
      price: "$595,000",
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1600,
      status: "Pending",
      type: "Townhouse",
      listed: "5 days ago"
    }
  ];

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "For Sale": return "bg-green-100 text-green-800";
      case "Sold": return "bg-gray-100 text-gray-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-2">Manage your property listings and inventory</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search properties..."
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

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{property.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{property.address}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(property.status)}>
                  {property.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-green-600">{property.price}</div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-gray-600 text-xs">Beds</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-gray-600 text-xs">Baths</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{property.sqft}</div>
                    <div className="text-gray-600 text-xs">Sq Ft</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <Badge variant="outline" className="text-xs">
                    {property.type}
                  </Badge>
                  <span>Listed {property.listed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No properties found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyList;
