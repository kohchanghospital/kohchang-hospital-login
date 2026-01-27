import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { fetchMe, logout } from "./services/api";
import AnnouncementList from "./pages/AnnouncementList";
import History from "./pages/History";

type User = {
  id: number;
  name: string;
  email: string;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn) {
        setCheckingAuth(false);
        return;
      }

      try {
        const res = await fetchMe();
        setUser(res.data);
      } catch {
        localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch { }

    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return (
    <Routes>
      {/* หน้า Login */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login onLoginSuccess={() => setIsLoggedIn(true)} />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn && user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/announcements"
        element={
          isLoggedIn && user ? (
            <AnnouncementList user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/history"
        element={
          isLoggedIn && user ? (
            <History user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
