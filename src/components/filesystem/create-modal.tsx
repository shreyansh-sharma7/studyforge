// components/filesystem/CreateNodeModal.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeCreated: () => void;
  userId: string | null;
  username: string | null;
}

export default function CreateNodeModal({
  isOpen,
  onClose,
  onNodeCreated,
  userId,
  username,
}: CreateNodeModalProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    type: "folder" as "folder" | "file",
    metadata: {},
    path: "/",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("nodes").insert([
        {
          user_id: userId,
          username,
          parent_id: null, // Root level for now
          name: formData.name,
          type: formData.type,
          metadata: formData.metadata,
          path: formData.path,
        },
      ]);

      if (error) throw error;

      // Reset form and close modal
      setFormData({ name: "", type: "folder", metadata: {}, path: "/" });
      onNodeCreated();
      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">Create New Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name..."
            />
          </div>

          <div>
            <label
              htmlFor="path"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Name
            </label>
            <input
              type="path"
              id="path"
              name="path"
              value={formData.path}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name..."
            />
          </div>

          {/* Type Selection */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option className="bg-slate-900 text-gray-100" value="folder">
                📁 Folder
              </option>
              <option className="bg-slate-900 text-gray-100" value="file">
                📄 File
              </option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-100 bg-transparent rounded-md hover:underline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
