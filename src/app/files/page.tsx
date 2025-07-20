// app/filesystem/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/filesystem/create-modal";
import { AiOutlineFolder, AiOutlineFile } from "react-icons/ai";
import { redirect } from "next/navigation";
import { NodeType } from "../../../database.types";

export default function FileSystemPage() {
  //get url path
  const params = new URLSearchParams(document.location.search);
  const urlPath = params.get("path");
  const urlUser = params.get("user");

  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUsername(user.user_metadata.display_name);
        //if user redirected to just /files then send them to their own page
        if (urlUser == null || urlPath == null) {
          location.assign(`/files?user=${user.id}&path=/`);
        } else {
          fetchNodes(urlUser, urlPath);
        }
      }
    };
    getCurrentUser();
  }, []);

  const fetchNodes = async (userId: string, path: string) => {
    //fetches ALL nodes branded to the user from the database
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    //adds nodes to an array
    if (!error) {
      setNodes(data || []);
    }
  };

  //get folder using userid and path
  // const getFolder = async (userId = urlUser, path = urlPath) => {
  //   const { data, error } = await supabase
  //     .from("nodes")
  //     .select("*")
  //     .eq("user_id", userId)
  //     .eq("path", path);
  //   return data;
  // };

  const createUserSchema = async (userId = urlUser) => {
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("user_id", userId);

    const schema: any = {};

    data!.map((node: NodeType) => {
      const path = node.path;
      const parts = path.replace(/^\/|\/$/g, "").split("/");
      let current = schema;

      for (const part of parts) {
        if (!current[part]) current[part] = { _data: node };
        current = current[part];
      }
    });
    console.log(schema);
    return schema;
  };

  const handleNodeCreated = () => {
    if (currentUserId) {
      fetchNodes(currentUserId);
    }
  };

  //gets the schema for a specific folder
  async function getFolderSchema(path = urlPath) {
    const userSchema = await createUserSchema();

    if (path == "/") return userSchema;
    // Remove leading/trailing slashes and split

    const parts = path!.replace(/^\/|\/$/g, "").split("/");
    let curr = userSchema;
    for (const part of parts) {
      if (curr && curr.hasOwnProperty(part)) {
        curr = curr[part];
      } else {
        return undefined; // Path does not exist
      }
    }
    return curr;
  }

  getFolderSchema();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">My Files</h1>

        {/* Files/Folders List */}
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {nodes.map((node: NodeType) => (
            <div
              key={node.id}
              className="flex flex-col items-center justify-center bg-slate-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              style={{ width: 120, minHeight: 120 }} // Adjust size as needed
            >
              <div className="mb-2 text-6xl text-primary">
                {node.type === "folder" ? (
                  <AiOutlineFolder />
                ) : (
                  <AiOutlineFile />
                )}
              </div>
              <span className="text-sm break-all text-center text-gray-100 mt-1">
                {node.name}
              </span>
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
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg transition-colors z-50"
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
        username={currentUsername}
      />
    </div>
  );
}
