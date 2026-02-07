import React from "react";

interface SettingCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SettingCard({
  title,
  description,
  children,
  disabled = false,
}: SettingCardProps) {
  return (
    <div
      className={`bg-white border border-border-dark rounded-[8px] p-6 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}
