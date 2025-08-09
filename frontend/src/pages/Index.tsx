
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import Dashboard from "@/components/Dashboard";
import ContactList from "@/components/entities/contacts/ContactList";
import LeadList from "@/components/entities/leads/LeadList";
import PropertyList from "@/components/entities/properties/PropertyList";
import TransactionList from "@/components/entities/transactions/TransactionList";
import TaskList from "@/components/entities/tasks/TaskList";
import CommunicationList from "@/components/entities/communications/CommunicationList";
import MainLayout from "@/components/layout/MainLayout";

// Auth Context
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-gray-50">
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contacts" element={<ContactList />} />
                <Route path="/leads" element={<LeadList />} />
                <Route path="/properties" element={<PropertyList />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/communications" element={<CommunicationList />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </div>
        </SidebarProvider>
      )}
    </AuthContext.Provider>
  );
};

export default Index;
