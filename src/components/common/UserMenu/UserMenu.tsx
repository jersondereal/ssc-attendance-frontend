import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpIcon from "@mui/icons-material/Help";
import KeyIcon from "@mui/icons-material/Key";
import axios, { AxiosError } from "axios";
import { UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import config from "../../../config";
import { DropdownSelector } from "../DropdownSelector/DropdownSelector";
import { Modal } from "../Modal/Modal";
import { Toast } from "../Toast/Toast";

interface User {
  id: string;
  username: string;
  role: "administrator" | "moderator" | "viewer";
}

interface UserFormData {
  username: string;
  password: string;
  role: User["role"];
}

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginAttempts {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface UserMenuProps {
  onLogout?: () => void;
  onUserChange?: (user: { username: string; role: string } | null) => void;
}

// Add this constant for role options
const roleOptions = [
  {
    value: "administrator",
    label: "Administrator",
    description:
      "Full access to all features including user management, student management, and attendance tracking",
  },
  {
    value: "moderator",
    label: "Moderator",
    description:
      "Can manage students and attendance, but cannot manage user accounts",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to view attendance and student data only",
  },
];

// Add role priority mapping
const rolePriority: Record<User["role"], number> = {
  administrator: 1,
  moderator: 2,
  viewer: 3,
};

export const UserMenu = ({ onLogout, onUserChange }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    role: "administrator",
  });
  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempts>({
    count: 0,
    lastAttempt: 0,
  });
  const [isLoginBlocked, setIsLoginBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const loginFormRef = useRef<HTMLFormElement>(null);

  const getRoleLabel = useCallback((role: User["role"] | undefined) => {
    if (!role) return "";

    switch (role) {
      case "administrator":
        return "Administrator";
      case "moderator":
        return "Moderator";
      case "viewer":
        return "Viewer";
      default:
        return role;
    }
  }, []);

  // Check for existing token on component mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const { token, user } = JSON.parse(storedUser);
          if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setCurrentUser(user);
            setIsAuthenticated(true);
            setIsLoginModalOpen(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          localStorage.removeItem("user");
        }
      }
      setIsLoginModalOpen(true);
      setIsAuthenticated(false);
      setCurrentUser(null);
    };

    checkAuth();
  }, []); // Run only on mount

  // Check login timeout on mount
  useEffect(() => {
    const checkLoginTimeout = () => {
      const timeoutData = localStorage.getItem("ssc-login-timeout");
      if (timeoutData) {
        try {
          const { blockedUntil } = JSON.parse(timeoutData);
          const now = Date.now();

          if (now < blockedUntil) {
            setIsLoginBlocked(true);
            setBlockedUntil(blockedUntil);
          } else {
            // Timeout expired, clear it
            localStorage.removeItem("ssc-login-timeout");
            setIsLoginBlocked(false);
            setBlockedUntil(null);
          }
        } catch (error) {
          console.error("Error parsing login timeout data:", error);
          localStorage.removeItem("ssc-login-timeout");
        }
      }
    };

    checkLoginTimeout();
  }, []);

  // Load login attempts from localStorage
  useEffect(() => {
    const storedAttempts = localStorage.getItem("ssc-login-attempts");
    if (storedAttempts) {
      try {
        const attempts = JSON.parse(storedAttempts);
        setLoginAttempts(attempts);
      } catch (error) {
        console.error("Error parsing login attempts:", error);
        localStorage.removeItem("ssc-login-attempts");
      }
    }
  }, []);

  // Fetch admin accounts
  useEffect(() => {
    if (isAdminModalOpen) {
      fetchAdminAccounts();
    }
  }, [isAdminModalOpen]);

  const fetchAdminAccounts = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/users`);
      setAdminAccounts(response.data);
    } catch (error) {
      console.error("Error fetching admin accounts:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      password: "",
      role: "administrator",
    });
    setIsUserFormModalOpen(true);
    setIsAdminModalOpen(false);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setIsUserFormModalOpen(true);
    setIsAdminModalOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setIsAdminModalOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await axios.put(
          `${config.API_BASE_URL}/users/${selectedUser.id}`,
          formData
        );
        setToast({ message: "User updated successfully", variant: "success" });
      } else {
        await axios.post(`${config.API_BASE_URL}/users`, formData);
        setToast({ message: "User created successfully", variant: "success" });
      }
      await fetchAdminAccounts();
      setIsUserFormModalOpen(false);
      setIsAdminModalOpen(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setToast({
        message:
          axiosError.response?.data?.message ||
          "An error occurred while saving the user",
        variant: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await axios.delete(`${config.API_BASE_URL}/users/${selectedUser.id}`);
      setToast({ message: "User deleted successfully", variant: "success" });
      await fetchAdminAccounts();
      setIsDeleteModalOpen(false);
      setIsAdminModalOpen(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setToast({
        message:
          axiosError.response?.data?.message ||
          "An error occurred while deleting the user",
        variant: "error",
      });
    }
  };

  const handleUserFormClose = () => {
    setIsUserFormModalOpen(false);
    setIsAdminModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setIsAdminModalOpen(true);
  };

  // Notify parent of user changes
  useEffect(() => {
    if (!onUserChange) return; // Skip if no handler provided

    if (currentUser) {
      const userInfo = {
        username: currentUser.username,
        role: getRoleLabel(currentUser.role),
      };
      onUserChange(userInfo);
    } else {
      onUserChange(null);
    }
  }, [currentUser, getRoleLabel, onUserChange]);

  const handleLoginAttempt = (success: boolean) => {
    const now = Date.now();
    const newAttempts = {
      count: success ? 0 : loginAttempts.count + 1,
      lastAttempt: now,
    };

    setLoginAttempts(newAttempts);
    localStorage.setItem("ssc-login-attempts", JSON.stringify(newAttempts));

    // If 5 failed attempts, block for 15 minutes
    if (newAttempts.count >= 5) {
      const blockedUntil = now + 15 * 60 * 1000; // 15 minutes
      const timeoutData = { blockedUntil };
      localStorage.setItem("ssc-login-timeout", JSON.stringify(timeoutData));
      setIsLoginBlocked(true);
      setBlockedUntil(blockedUntil);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if login is blocked
    if (isLoginBlocked && blockedUntil) {
      const now = Date.now();
      if (now < blockedUntil) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / (60 * 1000));
        setToast({
          message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
          variant: "error",
        });
        return;
      } else {
        // Timeout expired
        localStorage.removeItem("ssc-login-timeout");
        setIsLoginBlocked(false);
        setBlockedUntil(null);
      }
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/users/login`,
        loginFormData
      );

      const { token, user } = response.data;

      // Configure axios to use the token
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Store user data and token in localStorage for persistence
      localStorage.setItem("user", JSON.stringify({ token, user }));

      // Update component state
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Reset login attempts on successful login
      handleLoginAttempt(true);

      // Show success toast
      setToast({ message: "Login successful!", variant: "success" });

      // Close the login modal and reset form
      setLoginFormData({ username: "", password: "" });
      setIsLoginModalOpen(false);

      // Notify parent of user change
      onUserChange?.({
        username: user.username,
        role: getRoleLabel(user.role),
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;

      // Record failed attempt
      handleLoginAttempt(false);

      setToast({
        message:
          axiosError.response?.data?.message ||
          "Login failed. Please check your credentials.",
        variant: "error",
      });
    }
  };

  const handleLogout = () => {
    // Clear token from axios headers
    delete axios.defaults.headers.common["Authorization"];

    // Clear localStorage
    localStorage.removeItem("user");

    // Reset component state
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsLoginModalOpen(true);

    // Close menu
    setIsOpen(false);

    // Show toast
    setToast({ message: "Logged out successfully", variant: "success" });

    // Notify parent of user change
    onUserChange?.(null);

    // Trigger parent component updates
    onLogout?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Login Modal */}
      <Modal isOpen={isLoginModalOpen} onClose={() => {}}>
        <div className="p-6">
          <img
            src="/logo.png"
            alt="SSC Logo"
            className="w-24 mx-auto mb-3 rounded-full shadow"
          />
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Welcome Back</h2>
              <p className="text-sm text-gray-500">Please login to continue</p>
            </div>
          </div>

          <form
            ref={loginFormRef}
            onSubmit={handleLoginSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={loginFormData.username}
                onChange={(e) =>
                  setLoginFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 ${
                  isLoginBlocked
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : ""
                }`}
                required
                autoFocus
                disabled={isLoginBlocked}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginFormData.password}
                onChange={(e) =>
                  setLoginFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 ${
                  isLoginBlocked
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : ""
                }`}
                required
                disabled={isLoginBlocked}
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoginBlocked
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
                disabled={isLoginBlocked}
              >
                {isLoginBlocked && blockedUntil ? (
                  <span>
                    Too many failed attempts.
                    <br />
                    Try again in{" "}
                    {Math.ceil((blockedUntil - Date.now()) / (60 * 1000))}{" "}
                    minutes
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setLoginFormData({
                  username: "student",
                  password: "password",
                });
                setTimeout(() => {
                  loginFormRef.current?.requestSubmit();
                }, 0);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Login as Student
            </button>
          </div>
        </div>
      </Modal>

      {/* Only show menu content when authenticated */}
      {isAuthenticated && (
        <>
          <div
            className="grid place-items-center border border-gray-800 rounded-full relative h-8 w-8 cursor-pointer hover:bg-gray-800 text-gray-300 hover:text-gray-100 transition-colors hover:border-gray-700 focus:ring-2 focus:ring-zinc-200 bg-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <UserRound size={16} className="absolute text-gray-300" />
          </div>

          {isOpen && (
            <div className="absolute px-1 right-0 top-full bg-white border border-border-dark rounded-md shadow-lg z-10 min-w-[10rem] mt-2">
              {/* Show current user info */}
              <div className="items-center gap-3 px-4 text-gray-700 font-medium text-xs border-b border-border-dark py-3 sm:hidden flex">
                <span>@{currentUser?.username}</span>
              </div>

              {/* Admin Accounts */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-normal rounded-md mt-1 ${
                  currentUser?.role !== "administrator"
                    ? "text-gray-400 cursor-not-allowed bg-gray-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  if (currentUser?.role === "administrator") {
                    setIsAdminModalOpen(true);
                    setIsOpen(false);
                  }
                }}
                disabled={currentUser?.role !== "administrator"}
                title={
                  currentUser?.role !== "administrator"
                    ? "Only Administrators can manage accounts"
                    : "Manage user accounts"
                }
              >
                <KeyIcon sx={{ fontSize: "1rem" }} />
                <span>Accounts</span>
              </button>

              {/* Help */}
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-normal rounded-md"
                onClick={() => {
                  console.log("Help clicked");
                  setIsOpen(false);
                }}
              >
                <HelpIcon sx={{ fontSize: "1rem" }} />
                <span>Help</span>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-300 mt-1" />

              {/* Logout */}
              <button
                className="w-full flex items-center gap-2 px-5 py-2 my-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 font-normal rounded-md"
                onClick={handleLogout}
              >
                <span>Log out</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Admin Accounts Modal */}
      <Modal
        isOpen={isAdminModalOpen && !isUserFormModalOpen && !isDeleteModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      >
        <div className="p-5 rounded-md">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold">Accounts Management</h2>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors"
            >
              <AddIcon sx={{ fontSize: "1rem" }} />
              Add User
            </button>
          </div>
          <div className="flex flex-col bg-white rounded-md gap-1.5">
            {adminAccounts
              .sort((a, b) => {
                // Always put "president" at the top
                if (a.username === "president") return -1;
                if (b.username === "president") return 1;
                // Then sort by role priority
                return rolePriority[a.role] - rolePriority[b.role];
              })
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 px-3 group rounded-md border border-gray-200"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">{user.username}</div>
                    <div className="text-xs text-gray-500">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
                    >
                      <EditIcon sx={{ fontSize: "1rem" }} />
                    </button>
                    {user.username !== "president" && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 hover:bg-red-100 rounded-md text-gray-500 hover:text-red-600"
                      >
                        <DeleteIcon sx={{ fontSize: "1rem" }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* Add/Edit User Form Modal */}
      <Modal isOpen={isUserFormModalOpen} onClose={handleUserFormClose}>
        <form onSubmit={handleFormSubmit} className="p-6">
          <h2 className="text-base font-semibold mb-6">
            {selectedUser ? "Edit User" : "Add New User"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-border-dark rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200 ${
                  selectedUser?.username === "president"
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : ""
                }`}
                required
                disabled={selectedUser?.username === "president"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password {selectedUser && "(leave blank to keep current)"}
                {selectedUser?.username === "president" &&
                  currentUser?.username !== "president" }
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-border-dark rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200 ${
                  selectedUser?.username === "president" &&
                  currentUser?.username !== "president"
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : ""
                }`}
                {...(!selectedUser && { required: true })}
                disabled={
                  selectedUser?.username === "president" &&
                  currentUser?.username !== "president"
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <DropdownSelector
                value={formData.role}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: value as User["role"],
                  }))
                }
                options={roleOptions}
                placeholder="Select role"
                className={`py-1.5 ${
                  selectedUser?.username === "president"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={selectedUser?.username === "president"}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={handleUserFormClose}
              className="flex-1 px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
            >
              {selectedUser ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleDeleteModalClose}>
        <div className="p-6">
          <h2 className="font-medium mb-4">Delete User?</h2>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete "{selectedUser?.username}"? This
            action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteModalClose}
              className="flex-1 px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
