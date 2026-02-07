// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface DropdownSelectorProps {
  className?: string;
  textClassName?: string;
  dropdownClassName?: string;
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
  textClassName = "",
  dropdownClassName = "",
  value,
  onChange,
  placeholder = "Select option",
  options,
  icon,
  name,
  disabled = false,
}: DropdownSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false); // Controls if entering/leaving class is applied (opacity/scale)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Controls mount/unmount
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal value with prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Logic for mounting/unmounting animated dropdown (like EventSelector)
  const handleOpenDropdown = () => {
    setIsDropdownVisible(true);
    setTimeout(() => setIsOpen(true), 10);
  };
  const handleCloseDropdown = () => {
    setIsOpen(false);
    setTimeout(() => setIsDropdownVisible(false), 200);
  };
  const handleToggleDropdown = () => {
    if (isOpen) {
      handleCloseDropdown();
    } else {
      handleOpenDropdown();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleCloseDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
    handleCloseDropdown();
  };

  const selectedOption = options.find((opt) => opt.value === internalValue);

  return (
    <div className={`relative text-sm ${textClassName} h-fit`} ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={internalValue || ""} />}
      <div
        className={`w-full flex flex-row h-fit items-center border border-border-dark px-4 py-2 gap-2 rounded-[8px] text-sm ${className} ${textClassName} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : "hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
        }`}
        onClick={() => !disabled && handleToggleDropdown()}
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-selected-value={internalValue || ""}
      >
        {icon && <span className="text-textbox-placeholder">{icon}</span>}
        <span
          className={`w-full truncate text-sm ${textClassName} ${selectedOption ? "" : "text-gray-400"} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {selectedOption?.label || placeholder}
        </span>
        {/* <ExpandMoreIcon sx={{ fontSize: "0.9rem", opacity: "0.3" }} /> */}
      </div>

      {isDropdownVisible && (
        <div
          className={`
            absolute top-full mt-1 bg-white border border-border-dark rounded-[8px] shadow-lg z-[9999] w-full min-w-40 text-sm
            transition-all duration-200 ease-in-out ${dropdownClassName || ""}
            ${isOpen
              ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
              : "opacity-0 scale-95 pointer-events-none -translate-y-2"
            }
          `}
          style={{
            transformOrigin: "top",
          }}
        >
          <div className="h-auto overflow-y-auto p-2 flex flex-col gap-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full rounded-[8px] text-left px-4 py-2.5 gap-y-1 hover:bg-gray-100 transition-colors text-sm ${textClassName} flex flex-row items-center justify-between`}
                type="button"
                tabIndex={0}
                aria-selected={internalValue === option.value}
              >
                <div className="flex-1 mr-2">
                  <div>{option.label}</div>
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
