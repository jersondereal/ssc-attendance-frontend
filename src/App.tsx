import { Analytics } from "@vercel/analytics/react";
// import axios from "axios";
import { BookOpen } from "lucide-react";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import NavigationMenu from "./components/common/NavigationMenu/NavigationMenu";
import { UserMenu } from "./components/common/UserMenu/UserMenu";
import { ToastProvider } from "./contexts/ToastContext";
import { useAuthStore } from "./stores/useAuthStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { AttendancePage } from "./pages/AttendancePage";
import { OverviewPage } from "./pages/OverviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudentPage } from "./pages/StudentPage";
import { StudentRegistrationPage } from "./pages/StudentRegistrationPage";
import { WelcomePage } from "./pages/WelcomePage";
import { UserGuide } from "./pages/UserGuide";
import { AIChatPage } from "./pages/AIChatPage";

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
  const navigate = useNavigate();
  const systemSettings = useSettingsStore((s) => s.systemSettings);
  const refreshSettings = useSettingsStore((s) => s.refreshSettings);
  const currentUser = useAuthStore((s) => s.currentUser);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  const standalonePages = ["/register"];

  const isStandalonePage = standalonePages.includes(pathname);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // get IP address and location of user
  // useEffect(() => {
  //   axios
  //     .get(
  //       `https://api.ipgeolocation.io/v2/ipgeo?apiKey=535486062e0045ac85d929f699d16ecd`,
  //       {
  //         method: "GET",
  //       }
  //     )
  //     .then((res) => {
  //       console.log("User IP:", res.data.ip);
  //       console.log("User Location:", {
  //         latitude: res.data.latitude,
  //         longitude: res.data.longitude,
  //         city: res.data.city,
  //         country: res.data.country_name,
  //         state: res.data.state_prov,
  //         district: res.data.district,
  //       });
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching location:", err);
  //     });
  // }, []);

  const isAdmin = currentUser?.role?.toLowerCase() === "administrator";
  const role = currentUser?.role?.toLowerCase();
  const showMaintenanceNotice =
    role === "viewer" && systemSettings.maintenanceMode;

  const handleOpenUserGuide = () => {
    navigate("/user-guide");
  };

  const isAiChat = pathname === "/ai-chat";

  return (
    <div className={`app bg-white flex flex-col ${isAiChat ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Analytics />
      {!isStandalonePage && (
        <>
          {/* Header */}
          <div
            className="fixed top-0 left-0 right-0 w-full h-fit flex flex-col border-b border-border-dark bg-white z-20"
          >
            {/* Header row */}
            <div className="flex flex-row items-center w-full pt-3 md:pt-0 px-4 flex-wrap gap-y-2">
              {/* Left: Logo and Title */}
              <a href="/overview" className="flex flex-row items-center gap-3 order-1">
                <img
                  src="/logo.png"
                  alt="SSC Logo"
                  className="h-8 w-auto"
                  style={{ maxHeight: "2rem" }}
                />
                <div className="border-l-2 border-gray-300 h-4 md:hidden lg:block"></div>
                <span className="text-[12px] font-semibold text-gray-900 flex-row items-center gap-1 flex md:hidden lg:flex">
                  Supreme Student Council{" "}
                  <span className="sm:block hidden">- ESSU Guiuan</span>
                </span>
              </a>
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
                {/* <div
                  className={`rounded-full cursor-not-allowed border border-gray-500 p-2 flex items-center justify-center ${
                    currentUser?.role === "Viewer" ? "hidden" : ""
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div> */}
                <button
                  type="button"
                  title="User Guide"
                  className={`rounded-full hidden border border-gray-500 p-2 items-center justify-center cursor-pointer ${
                    currentUser?.role === "Viewer" ? "hidden" : ""
                  }`}
                  onClick={handleOpenUserGuide}
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <UserMenu />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content (Routes) */}
      <div className={`flex-1 flex flex-col ${isAiChat ? "overflow-hidden min-h-0" : "min-h-full"} ${!isStandalonePage ? "pt-[115px] md:pt-14 pb-20" : ""}`}>
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
                  <OverviewPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/students"
              element={
                currentUser ? (
                  <StudentPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/attendance"
              element={
                currentUser ? (
                  <AttendancePage tableType="attendance" />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                currentUser && isAdmin ? (
                  <SettingsPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/register" element={<StudentRegistrationPage />} />
            <Route path="/user-guide" element={<UserGuide />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
      {/* Footer hidden on AI Chat page */}
      {/* <FooterSection /> */}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
