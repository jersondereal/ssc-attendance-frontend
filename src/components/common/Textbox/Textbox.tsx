import React from "react";

interface TextboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  icon?: React.ReactNode;
}

export const Textbox = React.forwardRef<HTMLInputElement, TextboxProps>(
  (
    {
      className = "",
      icon,
      ...inputProps
    },
    ref
  ) => {
    return (
      <div
        className={`${className} w-40 flex flex-row items-center border border-border-dark px-1.5 py-0 h-10 gap-2 rounded-[8px] focus-within:border-border-focus focus-within:ring-2 focus-within:ring-zinc-200 text-sm`}
      >
        <span className="text-textbox-placeholder">{icon && icon}</span>
        <input
          type="text"
          ref={ref}
          className="w-full outline-none text-base bg-transparent"
          autoComplete="off"
          {...inputProps}
        />
      </div>
    );
  }
);
Textbox.displayName = "Textbox";
