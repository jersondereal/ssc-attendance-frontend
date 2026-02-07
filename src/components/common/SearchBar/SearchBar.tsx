import SearchIcon from "@mui/icons-material/Search";
import { useRef, useState } from "react";

interface SearchBarProps {
  onSearch?: (value: string) => void;
  className?: string;
}

export const SearchBar = ({ onSearch, className = "" }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div
      onClick={() => {
        inputRef.current?.focus();
      }}
      className={`relative w-full md:w-fit ${className}`}
    >
      <div className="relative flex flex-row items-center border border-gray-300 w-full px-4 py-2 gap-2 rounded-[8px] focus-within:border-gray-400 bg-background-light">
        <span className="text-textbox-placeholder text-sm md:text-sm absolute left-2 top-1/2 -translate-y-1/2">
          <SearchIcon sx={{ fontSize: "1rem" }} />
        </span>
        <input
          ref={inputRef}
          type="text"
          className="outline-none text-base md:text-sm bg-transparent ml-4 w-full md:max-w-full md:w-28 md:focus-within:w-40 transition-all focus-within:origin-left"
          placeholder={"Search"}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
};
