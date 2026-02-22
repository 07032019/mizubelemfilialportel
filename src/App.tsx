import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import { AppSettings } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch settings");
        return res.json();
      })
      .then(data => setSettings(data))
      .catch(err => console.error("App settings fetch error:", err));
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return (
    <Router>
      <div 
        className="min-h-screen bg-stone-50 text-stone-900" 
        style={{ 
          '--primary': settings?.primaryColor || '#10b981',
          fontFamily: settings?.fontFamily || 'Inter'
        } as any}
      >
        <Navbar token={token} onLogout={logout} storeName={settings?.storeName} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!token ? <Login onLogin={login} /> : <Navigate to="/admin" />} />
            <Route 
              path="/admin" 
              element={token ? <AdminDashboard token={token} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
