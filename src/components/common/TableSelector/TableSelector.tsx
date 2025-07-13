import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import { Check } from 'lucide-react';

interface TableSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TableSelector = ({ value, onChange }: TableSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "attendance", label: "Attendance" },
    { value: "students", label: "Students" },
  ];

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
    onChange(newValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex flex-row items-center cursor-pointer gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-header text-xs">
          {selectedOption?.label}
        </span>
        <ChevronsUpDown size={12} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 bg-white border border-border-dark rounded-md shadow-lg z-10 min-w-[120px] p-1 flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full rounded-md text-left px-2 py-1.5 hover:bg-gray-100 transition-colors text-xs font-medium flex flex-row items-center justify-between ${
                value === option.value ? "" : ""
              }`}
            >
              {option.label}
              {value === option.value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
