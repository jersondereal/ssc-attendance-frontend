interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  id,
}: SwitchProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer
          ${
            disabled
              ? "bg-gray-200 cursor-not-allowed"
              : checked
              ? "bg-zinc-700"
              : "bg-gray-300"
          }
        `}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${checked ? "translate-x-6" : "translate-x-1"}
            ${disabled ? "opacity-50" : ""}
          `}
        />
      </div>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-900 select-none cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;

