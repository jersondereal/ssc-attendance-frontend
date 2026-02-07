import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

interface SubmitButtonProps {
  type?: "submit" | "button";
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function SubmitButton({
  type = "submit",
  disabled,
  loading,
  children,
  className = "",
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`flex-1 px-4 text-sm font-medium rounded-[8px] transition-colors grid place-items-center min-h-9 ${
        disabled
          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
          : "bg-zinc-700 text-white hover:bg-zinc-600"
      } ${className}`}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </button>
  );
}
