import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Checkbox = ({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
}: CheckboxProps) => {
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
    <div className={`flex items-center gap-2 ${className}`}>
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
          w-4 h-4 border rounded-[4px] cursor-pointer transition-all duration-200 grid place-items-center
          ${
            disabled
              ? "bg-gray-100 border-gray-300 cursor-not-allowed"
              : checked
              ? "bg-black border-black"
              : "bg-gray-50 border-gray-300 hover:border-black"
          }
        `}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        {checked && (
          <Check size={11} color='white' strokeWidth={4} />
        )}
      </div>
    </div>
  );
};

export default Checkbox;
