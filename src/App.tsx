import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewsUpload from "./pages/NewsUpload";
import { fetchMe, logout } from "./services/api";
import NewsList from "./pages/NewsList";
import AnnouncementList from "./pages/AnnouncementList";
import AnnouncementUpload from "./pages/AnnouncementUpload";

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
        path="/news"
        element={
          isLoggedIn && user ? (
            <NewsList user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/news/upload"
        element={
          isLoggedIn && user ? (
            <NewsUpload user={user} onLogout={handleLogout} />
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
        path="/announcements/upload"
        element={
          isLoggedIn && user ? (
            <AnnouncementUpload user={user} onLogout={handleLogout} />
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
