"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/filesystem/create-modal";
import { AiOutlineFolder, AiOutlineFile } from "react-icons/ai";
import { NodeType } from "../../../database.types";

// --- Util: extract direct child nodes of current folder ---
function getNodesAtLevel(folder: any): NodeType[] {
  if (!folder) return [];
  return Object.keys(folder)
    .filter((key) => key !== "_data")
    .map((key) => folder[key]._data);
}

// --- Util: navigate nested object by /path ---
function getSchemaAtPath(schema: any, path: string): any {
  if (!path || path === "/") return schema;
  const parts = path.replace(/^\/|\/$/g, "").split("/");
  let curr = schema;
  for (const part of parts) {
    if (curr && Object.prototype.hasOwnProperty.call(curr, part)) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

// --- Util: build nested tree from flat array of nodes ---
function buildUserSchema(flatNodes: NodeType[]): any {
  const schema: any = {};
  flatNodes.forEach((node) => {
    const parts = node.path.replace(/^\/|\/$/g, "").split("/");
    let curr = schema;
    for (const part of parts) {
      if (!curr[part]) curr[part] = { _data: undefined };
      curr = curr[part];
    }
    curr._data = node;
  });
  return schema;
}

export default function FileSystemPage() {
  // --- State declarations ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [userSchema, setUserSchema] = useState<any>(null);
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlUser, setUrlUser] = useState<string>("");
  const [urlPath, setUrlPath] = useState<string>("/");

  const supabase = createClient();

  // --- Extract URL params on mount (in browser only) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUrlUser(params.get("user") || "");
      setUrlPath(params.get("path") || "/");
    }
  }, []);

  // --- On user and path change: fetch current user and schema ---
  useEffect(() => {
    // Only proceed if params are available
    if (!urlUser || !urlPath) return;

    async function init() {
      setLoading(true);
      // 1. Get currently logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);
      setCurrentUsername(user.user_metadata.display_name);

      // 2. If params are missing, redirect to user's root
      if (!urlUser || !urlPath) {
        window.location.assign(`/files?user=${user.id}&path=/`);
        return;
      }

      // 3. Fetch all user nodes, build schema, get current nodes
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", urlUser);

      if (error) {
        setLoading(false);
        return;
      }

      const schema = buildUserSchema(data || []);
      setUserSchema(schema);
      const folderObj = getSchemaAtPath(schema, urlPath);
      setNodes(getNodesAtLevel(folderObj));
      setLoading(false);
    }

    init();
    // eslint-disable-next-line
  }, [urlUser, urlPath]);

  // --- Handler: re-fetch data after creating a node ---
  const handleNodeCreated = () => {
    // Just triggers the above useEffect by setting urlUser/urlPath again
    setLoading(true);
    setUrlUser((u) => u); // force re-run effect
    setUrlPath((p) => p);
  };

  // --- UI render ---
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          {currentUsername} {urlPath}
        </h1>

        {/* Files/Folders List */}
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {nodes.map((node: NodeType) => (
            <div
              key={node.id}
              className="flex flex-col items-center justify-center bg-slate-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              style={{ width: 120, minHeight: 120 }}
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

        {!loading && nodes.length === 0 && (
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
