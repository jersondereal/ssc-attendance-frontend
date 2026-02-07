import { ReactNode } from "react";

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className = "" }: FormActionsProps) {
  return <div className={`flex gap-3 mt-8 ${className}`}>{children}</div>;
}
