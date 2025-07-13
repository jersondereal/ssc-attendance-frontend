import React from "react";

interface ButtonProps {
  className?: string;
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  title?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Button = ({
  className = "",
  icon,
  label,
  onClick,
  variant = "primary",
  title,
  type = "button",
  disabled = false,
}: ButtonProps) => {
  const variantStyles = {
    primary:
      "text-gray-800 bg-white hover:bg-gray-100 border border-border-dark hover:border-gray-400",
    secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200",
    danger:
      "text-red-500 hover:bg-red-50 hover:border-red-400 border border-red-300",
  };

  const paddingStyles = icon ? "pl-7 pr-3 py-1.5" : "px-3 py-1.5";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-md focus:outline-none transition-colors h-fit w-fit text-nowrap text-xs flex flex-row items-center justify-center gap-2 ${
        variantStyles[variant]
      } ${paddingStyles} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      title={title}
    >
      {icon && <span className="text-current absolute left-2">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
};
