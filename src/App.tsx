import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { Sidebar } from "./components/common/Sidebar/Sidebar";
import { ToastProvider } from "./contexts/ToastContext";
import { useAuthStore } from "./stores/useAuthStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { AttendancePage } from "./pages/AttendancePage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
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

  const isAdmin = currentUser?.role?.toLowerCase() === "administrator";
  const role = currentUser?.role?.toLowerCase();
  const showMaintenanceNotice =
    role === "viewer" && systemSettings.maintenanceMode;

  const isAiChat = pathname === "/ai-chat";

  return (
    <div
      className={`app flex bg-gray-100 ${
        isAiChat ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <Analytics />
      {!isStandalonePage && (
        <Sidebar
          currentUserRole={currentUser?.role}
          hideAll={showMaintenanceNotice}
        />
      )}

      {/* Main Content (Routes) */}
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          isAiChat ? "min-h-0 overflow-hidden" : "min-h-screen"
        } ${!isStandalonePage ? "pt-14 md:pt-0" : ""}`}
      >
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
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                currentUser ? <DashboardPage /> : <Navigate to="/" replace />
              }
            />
            <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/events"
              element={
                currentUser ? <EventsPage /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/students"
              element={
                currentUser ? <StudentPage /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/events/:eventId"
              element={
                currentUser ? (
                  <AttendancePage tableType="attendance" />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/attendance" element={<Navigate to="/events" replace />} />
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
