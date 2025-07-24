import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

const Input: React.FC<InputProps> = ({ label, error = null, id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-400 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3 py-2 border rounded-md text-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? "border-red-500" : "border-gray-700"} 
        `}
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
