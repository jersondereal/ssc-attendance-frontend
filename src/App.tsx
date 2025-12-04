import { Analytics } from "@vercel/analytics/react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import NavigationMenu from "./components/common/NavigationMenu/NavigationMenu";
import { UserMenu } from "./components/common/UserMenu/UserMenu";
import { ToastProvider } from "./contexts/ToastContext";
import { AttendancePage } from "./pages/AttendancePage";
import { EventsPage } from "./pages/EventsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudentPage } from "./pages/StudentPage";
import { WelcomePage } from "./pages/WelcomePage";
import { BookOpen, Bell } from "lucide-react";

function AppContent() {
  const [selectedTable, setSelectedTable] = useState("attendance");
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);

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

  return (
    <div className="app bg-white h-[100vh]">
      <Analytics />
      {/* Header */}
      <div
        className={`w-full h-fit flex flex-col py-0 p-4 border-b border-border-dark bg-white z-20 ${
          selectedTable !== "settings" ? "mb-5" : ""
        }`}
      >
        {/* First Level: Logo/Title and UserMenu */}
        <div className="flex flex-row items-center w-full pt-3">
          {/* Left: Logo and Title */}
          <div className="flex flex-row items-center gap-3">
            <img
              src="/logo.png"
              alt="SSC Logo"
              className="h-8 w-auto"
              style={{ maxHeight: "2rem" }}
            />
            <div className="border-l-2 border-gray-300 h-4 rotate-12 "></div>
            <span className="text-[12px] font-semibold text-gray-900 flex flex-row items-center gap-1">
              Supreme Student Council <span className="sm:block hidden">- ESSU Guiuan</span>
            </span>
          </div>
          {/* Right: User Menu */}
          <div className="flex flex-row items-center gap-2 ml-auto">
            <div className="rounded-full cursor-not-allowed border border-gray-500 p-2 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="rounded-full cursor-not-allowed border border-gray-500 p-2 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <UserMenu onLogout={handleLogout} onUserChange={handleUserChange} />
          </div>
        </div>
        {/* Second Level: Navigation Menu */}
        <div className="flex flex-row items-center w-full border-border-dark">
          <NavigationMenu
            activeItem={selectedTable}
            onItemClick={setSelectedTable}
          />
        </div>
      </div>

      {!currentUser ? (
        <WelcomePage />
      ) : selectedTable === "events" ? (
        <EventsPage />
      ) : selectedTable === "settings" ? (
        <SettingsPage currentUser={currentUser} />
      ) : selectedTable === "students" ? (
        <StudentPage currentUser={currentUser} />
      ) : (
        <AttendancePage tableType="attendance" currentUser={currentUser} />
      )}
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
