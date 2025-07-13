import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface DropdownSelectorProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options: Option[];
  icon?: React.ReactNode;
  name?: string;
  disabled?: boolean;
}

export const DropdownSelector = ({
  className = "",
  value,
  onChange,
  placeholder = "Select option",
  options,
  icon,
  name,
  disabled = false,
}: DropdownSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === internalValue);

  return (
    <div className="relative text-xs h-fit" ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={internalValue || ""} />}
      <div
        className={`w-full flex flex-row h-fit items-center border border-border-dark px-3 py-1 gap-2 rounded-md text-xs ${className} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : "hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {icon && <span className="text-textbox-placeholder">{icon}</span>}
        <input
          type="text"
          className={`w-full outline-none text-xs bg-transparent ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          placeholder={placeholder}
          value={selectedOption?.label || ""}
          readOnly
        />
        <ExpandMoreIcon sx={{ fontSize: "0.9rem", opacity: "0.3" }} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border border-border-dark rounded-md shadow-lg z-[9999] w-full text-xs">
          <div className="max-h-48 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full rounded-md text-left px-2 py-1.5 hover:bg-gray-100 transition-colors text-xs flex flex-row items-center justify-between`}
              >
                <div className="flex-1 mr-2">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-gray-400 text-[11px] mt-1 leading-3 font-light">
                      {option.description}
                    </div>
                  )}
                </div>
                {internalValue === option.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
