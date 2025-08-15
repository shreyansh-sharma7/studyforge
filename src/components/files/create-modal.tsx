"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { NodeType } from "../../../database.types";
import Modal from "@/components/ui/modal";
import Input from "../ui/input";
import Select from "../ui/select";

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeCreated: (path: string, user_id: string, updateAll?: boolean) => void;
  userId: string | null;
  username: string | null;
  currentPath: string;
  existingFolders: string[];
}

export default function CreateNodeModal({
  isOpen,
  onClose,
  onNodeCreated,
  userId,
  username,
  currentPath,
  existingFolders,
}: CreateNodeModalProps) {
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    type: "folder" as "folder" | "file" | "todo",
    metadata: {},
    path: "/",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        path: currentPath,
      }));
      setError(null);
      setLoading(false);
      setFormData((prev) => ({
        ...prev,
        name: "",
        type: "folder",
        metadata: {},
      }));
    }
  }, [isOpen, currentPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      const node: Partial<NodeType> = {
        user_id: userId,
        username,
        parent_id: null, // set parent_id logic if needed
        name: trimmedName,
        type: formData.type,
        metadata: formData.metadata,
        path: `${formData.path === "/" ? "" : formData.path}/${trimmedName}.${
          formData.type == "folder" ? "/" : formData.type
        }`,
      };

      const { error: insertError } = await supabase
        .from("nodes")
        .insert([node]);
      if (insertError) throw insertError;

      setFormData({ name: "", type: "folder", metadata: {}, path: "/" });
      onNodeCreated(node.path!, node.user_id!);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Item"
      footer={
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
            form="create-node-form"
            disabled={loading || !formData.name.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      }
    >
      <form id="create-node-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter name..."
          required
          error={
            error && formData.name.trim() === "" ? "Name is required" : null
          }
        />

        <Select
          label="Location"
          name="path"
          value={formData.path}
          onChange={handleInputChange}
          required
          options={existingFolders.map((folder) => ({
            value: folder,
            label: folder,
          }))}
        />

        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          options={[
            { value: "folder", label: "📁 Folder" },
            { value: "file", label: "📄 File" },
            { value: "todo", label: "todo" },
          ]}
        />

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
