import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { fetchMe, logout } from "./services/api";
import Activity from "./pages/Activity";
import AnnouncementList from "./pages/AnnouncementList";
import History from "./pages/History";
import Vision from "./pages/Vision";
import Knowledge from "./pages/Knowledge";
import Donation from "./pages/Donation";
import Management from "./pages/Management";
import { Toaster } from "react-hot-toast";
import { AdminShellSkeleton } from "./components/SkeletonScreens";
import Car from "./pages/Car";

type User = {
  id: number;
  name: string;
  email: string;
};

function App() {
  const isInitiallyLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const [isLoggedIn, setIsLoggedIn] = useState(isInitiallyLoggedIn);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(isInitiallyLoggedIn);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn) {
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(true);

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
    } catch {
      // Logout should still clear local session state if the server is unavailable.
    }

    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setUser(null);
  };

  if (checkingAuth) {
    return <AdminShellSkeleton />;
  }

  return (
    <>
      <Toaster position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }} />
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
          path="/activity"
          element={
            isLoggedIn && user ? (
              <Activity user={user} onLogout={handleLogout} />
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
          path="/knowledges"
          element={
            isLoggedIn && user ? (
              <Knowledge user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/car"
          element={
            isLoggedIn && user ? (
              <Car user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/setting"
          element={
            isLoggedIn && user ? (
              <Dashboard user={user} onLogout={handleLogout} />
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

        <Route
          path="/management"
          element={
            isLoggedIn && user ? (
              <Management user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/vision"
          element={
            isLoggedIn && user ? (
              <Vision user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/donation"
          element={
            isLoggedIn && user ? (
              <Donation user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
