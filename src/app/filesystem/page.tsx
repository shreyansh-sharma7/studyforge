// app/filesystem/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/filesystem/create-modal";

export default function FileSystemPage() {
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchNodes(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const fetchNodes = async (userId: string) => {
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setNodes(data || []);
    }
  };

  const handleNodeCreated = () => {
    if (currentUserId) {
      fetchNodes(currentUserId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Files</h1>

        {/* Files/Folders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node: any) => (
            <div
              key={node.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {node.type === "folder" ? "📁" : "📄"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{node.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {node.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(node.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No files or folders yet. Create your first one!
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-50"
      >
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      {/* Modal */}
      <CreateNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNodeCreated={handleNodeCreated}
        userId={currentUserId}
      />
    </div>
  );
}
