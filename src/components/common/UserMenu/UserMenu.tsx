import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import config from "../../../config";
import { useAuthStore } from "../../../stores/useAuthStore";
import { Toast } from "../Toast/Toast";
import { AdminAccountsModal } from "./AdminAccountsModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { LoginModal } from "./LoginModal";
import type {
  LoginAttempts,
  LoginFormData,
  User,
  UserFormData,
} from "./types";
import { getRoleLabel } from "./types";
import { UserFormModal } from "./UserFormModal";
import { UserMenuDropdown } from "./UserMenuDropdown";

export const UserMenu = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoginModalOpen = useAuthStore((s) => s.isLoginModalOpen);
  const setUser = useAuthStore((s) => s.setUser);
  const logout: () => void = useAuthStore((s) => s.logout);

  const [isOpen, setIsOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const loginFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timeoutData = localStorage.getItem("ssc-login-timeout");
    if (timeoutData) {
      try {
        const { blockedUntil: until } = JSON.parse(timeoutData);
        const now = Date.now();
        if (now < until) {
          setIsLoginBlocked(true);
          setBlockedUntil(until);
        } else {
          localStorage.removeItem("ssc-login-timeout");
          setIsLoginBlocked(false);
          setBlockedUntil(null);
        }
      } catch (error) {
        console.error("Error parsing login timeout data:", error);
        localStorage.removeItem("ssc-login-timeout");
      }
    }
  }, []);

  useEffect(() => {
    const storedAttempts = localStorage.getItem("ssc-login-attempts");
    if (storedAttempts) {
      try {
        setLoginAttempts(JSON.parse(storedAttempts));
      } catch (error) {
        console.error("Error parsing login attempts:", error);
        localStorage.removeItem("ssc-login-attempts");
      }
    }
  }, []);

  const fetchAdminAccounts = useCallback(async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/users`);
      setAdminAccounts(response.data);
    } catch (error) {
      console.error("Error fetching admin accounts:", error);
    }
  }, []);

  useEffect(() => {
    if (isAdminModalOpen) fetchAdminAccounts();
  }, [isAdminModalOpen, fetchAdminAccounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginAttempt = useCallback(
    (success: boolean) => {
      const now = Date.now();
      const newAttempts = {
        count: success ? 0 : loginAttempts.count + 1,
        lastAttempt: now,
      };
      setLoginAttempts(newAttempts);
      localStorage.setItem("ssc-login-attempts", JSON.stringify(newAttempts));
    },
    [loginAttempts.count]
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginBlocked && blockedUntil) {
      const now = Date.now();
      if (now < blockedUntil) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / (60 * 1000));
        setToast({
          message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
          variant: "error",
        });
        return;
      }
      localStorage.removeItem("ssc-login-timeout");
      setIsLoginBlocked(false);
      setBlockedUntil(null);
    }
    setIsLoggingIn(true);
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/users/login`,
        loginFormData
      );
      const { token, user } = response.data;
      setUser(
        {
          id: user.id,
          username: user.username,
          role: getRoleLabel(user.role),
          rawRole: user.role,
        },
        token
      );
      handleLoginAttempt(true);
      setToast({ message: "Login successful!", variant: "success" });
      setLoginFormData({ username: "", password: "" });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      handleLoginAttempt(false);
      setToast({
        message:
          axiosError.response?.data?.message ||
          "Login failed. Please check your credentials.",
        variant: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickFillStudent = useCallback(() => {
    setLoginFormData({ username: "student", password: "password" });
    setTimeout(() => loginFormRef.current?.requestSubmit(), 0);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
    setToast({ message: "Logged out successfully", variant: "success" });
  }, [logout]);

  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setFormData({ username: "", password: "", role: "administrator" });
    setIsUserFormModalOpen(true);
    setIsAdminModalOpen(false);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setIsUserFormModalOpen(true);
    setIsAdminModalOpen(false);
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setIsAdminModalOpen(false);
  }, []);

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

  return (
    <div className="relative" ref={menuRef}>
      <LoginModal
        isOpen={isLoginModalOpen}
        formData={loginFormData}
        onFormDataChange={setLoginFormData}
        onSubmit={handleLoginSubmit}
        isLoggingIn={isLoggingIn}
        isLoginBlocked={isLoginBlocked}
        blockedUntil={blockedUntil}
        formRef={loginFormRef}
        onQuickFillStudent={handleQuickFillStudent}
      />

      {isAuthenticated && currentUser && (
        <UserMenuDropdown
          currentUser={{
            id: currentUser.id ?? "",
            username: currentUser.username,
            role: currentUser.rawRole ?? "viewer",
          }}
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          onAccountsClick={() => {
            setIsAdminModalOpen(true);
            setIsOpen(false);
          }}
          onHelpClick={() => {
            console.log("Help clicked");
            setIsOpen(false);
          }}
          onLogout={handleLogout}
        />
      )}

      <AdminAccountsModal
        isOpen={isAdminModalOpen && !isUserFormModalOpen && !isDeleteModalOpen}
        adminAccounts={adminAccounts}
        onClose={() => setIsAdminModalOpen(false)}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      <UserFormModal
        isOpen={isUserFormModalOpen}
        formData={formData}
        onFormDataChange={setFormData}
        selectedUser={selectedUser}
        currentUser={
          currentUser
            ? {
                id: currentUser.id ?? "",
                username: currentUser.username,
                role: currentUser.rawRole ?? "viewer",
              }
            : null
        }
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsUserFormModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        selectedUser={selectedUser}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

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
