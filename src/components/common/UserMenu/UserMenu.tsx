import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpIcon from "@mui/icons-material/Help";
import KeyIcon from "@mui/icons-material/Key";
import PersonIcon from "@mui/icons-material/Person";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import config from "../../../config";
import { DropdownSelector } from "../DropdownSelector/DropdownSelector";
import { Modal } from "../Modal/Modal";
import { Toast } from "../Toast/Toast";

interface User {
  id: string;
  username: string;
  role: "president" | "vice_president" | "admin";
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

interface UserMenuProps {
  onLogout?: () => void;
  onUserChange?: (user: { username: string; role: string } | null) => void;
}

// Add this constant for role options
const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "vice_president", label: "Vice President" },
  { value: "president", label: "President" },
];

// Add role priority mapping
const rolePriority: Record<User["role"], number> = {
  president: 1,
  vice_president: 2,
  admin: 3,
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
    role: "admin",
  });
  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const getRoleLabel = useCallback((role: User["role"] | undefined) => {
    if (!role) return "";

    switch (role) {
      case "president":
        return "SSC President";
      case "vice_president":
        return "SSC Vice President";
      case "admin":
        return "Admin";
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
      role: "admin",
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Welcome Back</h2>
              <p className="text-sm text-gray-500">Please login to continue</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                className="w-full px-3 py-2 border border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
                required
                autoFocus
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
                className="w-full px-3 py-2 border border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
                required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors text-sm font-medium"
              >
                Login
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account? <br /> Please contact your SSC President or
              Vice President.
            </p>
          </div>
        </div>
      </Modal>

      {/* Only show menu content when authenticated */}
      {isAuthenticated && (
        <>
          <div
            className="grid place-items-center border border-border-dark rounded-md p-[0.225rem] cursor-pointer hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors hover:border-gray-600 focus:ring-2 focus:ring-zinc-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <PersonIcon sx={{ fontSize: "1.3rem" }} />
          </div>

          {isOpen && (
            <div className="absolute right-0 top-full bg-white border border-border-dark rounded-md shadow-lg z-10 min-w-[16rem] mt-2">
              {/* Show current user info */}
              <div className="items-center gap-3 px-4 text-gray-700 font-medium text-xs border-b border-border-dark py-3 sm:hidden flex">
                <span>{currentUser?.username}</span>
              </div>

              {/* Admin Accounts */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-normal rounded-md mt-1 ${
                  currentUser?.role === "admin"
                    ? "text-gray-400 cursor-not-allowed bg-gray-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  if (currentUser?.role !== "admin") {
                    setIsAdminModalOpen(true);
                    setIsOpen(false);
                  }
                }}
                disabled={currentUser?.role === "admin"}
                title={
                  currentUser?.role === "admin"
                    ? "Only Presidents and Vice Presidents can manage accounts"
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
              <div className="border-t border-border-dark mt-1" />

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
        <div className="p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
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
              .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 px-3 group rounded-md border border-border-dark"
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
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-1.5 hover:bg-red-100 rounded-md text-gray-500 hover:text-red-600"
                    >
                      <DeleteIcon sx={{ fontSize: "1rem" }} />
                    </button>
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
                className="w-full px-3 py-2 border border-border-dark rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password {selectedUser && "(leave blank to keep current)"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border-dark rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200"
                {...(!selectedUser && { required: true })}
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
                className="py-1.5"
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
