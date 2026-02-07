import { Analytics } from "@vercel/analytics/react";
import axios from "axios";
import { Bell, BookOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import NavigationMenu from "./components/common/NavigationMenu/NavigationMenu";
import { UserMenu } from "./components/common/UserMenu/UserMenu";
import { FooterSection } from "./components/shared"; // import the FooterSection
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AttendancePage } from "./pages/AttendancePage";
import { OverviewPage } from "./pages/OverviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudentPage } from "./pages/StudentPage";
import { StudentRegistrationPage } from "./pages/StudentRegistrationPage";
import { WelcomePage } from "./pages/WelcomePage";

function MaintenanceNotice() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Offline for maintenance
        </h1>
        <p className="text-gray-600">
          The website is currently undergoing scheduled maintenance. Please
          check back later.
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { pathname } = useLocation();
  const { systemSettings } = useSettings();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);

  const standalonePages = ["/register"];

  const isSettings = pathname === "/settings";
  const isStandalonePage = standalonePages.includes(pathname);

  // get IP address and location of user
  useEffect(() => {
    axios
      .get(
        `https://api.ipgeolocation.io/v2/ipgeo?apiKey=535486062e0045ac85d929f699d16ecd`,
        {
          method: "GET",
        }
      )
      .then((res) => {
        console.log("User IP:", res.data.ip);
        console.log("User Location:", {
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          city: res.data.city,
          country: res.data.country_name,
          state: res.data.state_prov,
          district: res.data.district,
        });
      })
      .catch((err) => {
        console.error("Error fetching location:", err);
      });
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const handleUserChange = useCallback(
    (user: { username: string; role: string } | null) => {
      setCurrentUser(user);
    },
    []
  );

  const isAdmin = currentUser?.role?.toLowerCase() === "administrator";
  const role = currentUser?.role?.toLowerCase();
  const showMaintenanceNotice =
    role === "viewer" && systemSettings.maintenanceMode;

  return (
    <div className="app bg-white min-h-screen flex flex-col">
      <Analytics />
      {!isStandalonePage && (
        <>
          {/* Header */}
          <div
            className={`w-full h-fit flex flex-col border-b border-border-dark bg-white z-20 ${
              !isSettings ? "mb-5" : ""
            }`}
          >
            {/* Header row */}
            <div className="flex flex-row items-center w-full pt-3 md:pt-0 px-4 flex-wrap gap-y-2">
              {/* Left: Logo and Title */}
              <div className="flex flex-row items-center gap-3 order-1">
                <img
                  src="/logo.png"
                  alt="SSC Logo"
                  className="h-8 w-auto"
                  style={{ maxHeight: "2rem" }}
                />
                <div className="border-l-2 border-gray-300 h-4 rotate-12 md:hidden lg:block "></div>
                <span className="text-[12px] font-semibold text-gray-900 flex-row items-center gap-1 flex md:hidden lg:flex">
                  Supreme Student Council{" "}
                  <span className="sm:block hidden">- ESSU Guiuan</span>
                </span>
              </div>
              {/* Navigation: below on mobile, left of user menu on md+ */}
              <div className="order-3 w-full md:order-2 md:w-fit md:flex-1 md:mx-4">
                <NavigationMenu
                  currentUserRole={currentUser?.role}
                  hideAll={showMaintenanceNotice}
                  disableUnauthorized
                />
              </div>
              {/* Right: User Menu */}
              <div className="flex flex-row items-center gap-2 ml-auto md:ml-10 order-2 md:order-3">
                <div
                  className={`rounded-full cursor-not-allowed border border-gray-500 p-2 flex items-center justify-center ${
                    currentUser?.role === "Viewer" ? "hidden" : ""
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div
                  className={`rounded-full cursor-not-allowed border border-gray-500 p-2 flex items-center justify-center ${
                    currentUser?.role === "Viewer" ? "hidden" : ""
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <UserMenu
                  onLogout={handleLogout}
                  onUserChange={handleUserChange}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content (Routes) */}
      <div className="flex-1 flex flex-col">
        {showMaintenanceNotice ? (
          <MaintenanceNotice />
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                !currentUser ? (
                  <WelcomePage />
                ) : (
                  <Navigate to="/overview" replace />
                )
              }
            />
            <Route
              path="/overview"
              element={
                currentUser ? (
                  <OverviewPage currentUser={currentUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/students"
              element={
                currentUser ? (
                  <StudentPage currentUser={currentUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/attendance"
              element={
                currentUser ? (
                  <AttendancePage
                    tableType="attendance"
                    currentUser={currentUser}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                currentUser && isAdmin ? (
                  <SettingsPage currentUser={currentUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/register" element={<StudentRegistrationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
      {/* Footer is now rendered on all pages */}
      <FooterSection />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
