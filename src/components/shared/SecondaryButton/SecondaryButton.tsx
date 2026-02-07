import type { ReactNode } from "react";

interface SecondaryButtonProps {
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function SecondaryButton({
  type = "button",
  onClick,
  children,
  className = "",
  fullWidth = true,
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 text-sm font-medium rounded-[8px] transition-colors min-h-9 ${
        fullWidth ? "w-full" : "flex-1"
      } bg-gray-100 text-gray-700 hover:bg-gray-200 ${className}`}
    >
      {children}
    </button>
  );
}
