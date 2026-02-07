interface LabeledInputProps {
  label: string;
  type?: "text" | "password" | "email";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  id?: string;
}

const inputBaseClass =
  "w-full px-3 py-2 border border-border-dark rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200";
const inputDisabledClass = "opacity-50 cursor-not-allowed bg-gray-50";

export function LabeledInput({
  label,
  type = "text",
  value,
  onChange,
  required,
  disabled,
  placeholder,
  autoFocus,
  inputClassName = "",
  id,
}: LabeledInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`${inputBaseClass} ${
          disabled ? inputDisabledClass : ""
        } ${inputClassName}`}
      />
    </div>
  );
}
