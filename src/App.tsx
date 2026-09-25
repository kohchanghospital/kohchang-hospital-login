import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import api, { fetchMe, logout } from "./services/api";
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
import OrganDonation from "./pages/OrganDonation";
import Setting from "./pages/Setting";
import Security from "./pages/Security";
import VerifyTwoFactor from "./pages/VerifyTwoFactor";
import SetupTwoFactor from "./pages/SetupTwoFactor";
import HeroSliders from "./pages/HeroSliders";
import Profile from "./pages/Profile";

type User = {
  id: number;
  name: string;
  email: string;
  username?: string | null;
};

function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const res = await fetchMe();
        if (active) { setUser(res.data); setIsLoggedIn(true); setPendingPath(null); }
      } catch {
        try {
          const res = await api.get("/two-factor/challenge");
          if (active) { setUser(null); setIsLoggedIn(false); setPendingPath(res.data.next || null); }
        } catch {
          if (active) { setUser(null); setIsLoggedIn(false); setPendingPath(null); }
        }
      } finally { if (active) setCheckingAuth(false); }
    };
    void checkAuth();
    return () => { active = false; };
  }, []);

  const handleVerified = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsLoggedIn(true);
    setPendingPath(null);
    navigate("/dashboard", { replace: true });
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Logout should still clear local session state if the server is unavailable.
    }


    setIsLoggedIn(false);
    setUser(null);
    setPendingPath(null);
    navigate("/", { replace: true });
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
              <Login onPending={(next) => { setPendingPath(next); navigate(next); }} />
            )
          }
        />

        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onPending={(next) => { setPendingPath(next); navigate(next); }} />} />
        <Route path="/2fa/setup" element={<SetupTwoFactor onVerified={handleVerified} />} />
        <Route path="/2fa/verify" element={<VerifyTwoFactor onVerified={handleVerified} />} />
        <Route path="/2fa/recovery" element={<VerifyTwoFactor onVerified={handleVerified} recovery />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn && user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/activity"
          element={
            isLoggedIn && user ? (
              <Activity user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/announcements"
          element={
            isLoggedIn && user ? (
              <AnnouncementList user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/knowledges"
          element={
            isLoggedIn && user ? (
              <Knowledge user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/car"
          element={
            isLoggedIn && user ? (
              <Car user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/settings"
          element={
            isLoggedIn && user ? (
              <Setting user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />
        <Route path="/security" element={<Navigate to="/profile/security" replace />} />
        <Route path="/profile" element={isLoggedIn && user ? <Profile user={user} onLogout={handleLogout} onUpdated={setUser} /> : <Navigate to={pendingPath || "/"} />} />
        <Route path="/profile/security" element={isLoggedIn && user ? <Security user={user} onLogout={handleLogout} /> : <Navigate to={pendingPath || "/"} />} />

        <Route
          path="/history"
          element={
            isLoggedIn && user ? (
              <History user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/management"
          element={
            isLoggedIn && user ? (
              <Management user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/vision"
          element={
            isLoggedIn && user ? (
              <Vision user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/donation"
          element={
            isLoggedIn && user ? (
              <Donation user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route
          path="/organ"
          element={
            isLoggedIn && user ? (
              <OrganDonation user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to={pendingPath || "/"} />
            )
          }
        />

        <Route path="/hero-sliders" element={isLoggedIn && user ? <HeroSliders user={user} onLogout={handleLogout} /> : <Navigate to={pendingPath || "/"} />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to={pendingPath || "/"} />} />
      </Routes>
    </>
  );
}

export default App;
