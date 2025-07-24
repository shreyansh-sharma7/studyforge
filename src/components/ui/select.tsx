import React, { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | null;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({
  label,
  error = null,
  id,
  options,
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-400 mb-1"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-3 py-2 border rounded-md text-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? "border-red-500" : "border-gray-700"} 
        `}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option
            key={value}
            value={value}
            className="bg-neutral-900 text-gray-100"
          >
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Select;
