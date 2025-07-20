"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/filesystem/create-modal";
import { AiOutlineFolder, AiOutlineFile } from "react-icons/ai";
import { NodeType } from "../../../database.types";
import BreadCrumbs from "@/components/filesystem/breadcrumbs";

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

function getAllFolderPaths(
  schema: any,
  currentPath = "",
  acc: string[] = []
): string[] {
  if (!schema) return acc;
  if (schema._data?.type === "folder" || currentPath === "") {
    acc.push(currentPath === "" ? "/" : currentPath);
    for (const key of Object.keys(schema)) {
      if (key !== "_data") {
        getAllFolderPaths(
          schema[key],
          `${currentPath === "" ? "" : currentPath}/` + key,
          acc
        );
      }
    }
  }
  return acc;
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

  const handleBreadcrumbNavigate = (crumbPath: string) => {
    setUrlPath(crumbPath);
    const params = new URLSearchParams(window.location.search);
    params.set("path", crumbPath);
    window.history.pushState({}, "", `?${params.toString()}`);
  };

  // --- Extract URL params on mount (in browser only) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("ran");
      const params = new URLSearchParams(window.location.search);
      setUrlUser(params.get("user") || "");
      setUrlPath(params.get("path") || "/");
    }
  }, []);

  // --- On user and path change: fetch current user and schema ---
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Only get query params directly from the browser, not from possibly stale state
      const params = new URLSearchParams(window.location.search);
      let realUser = params.get("user");
      let realPath = params.get("path");

      // 1. If missing params, redirect ONCE to set them in the URL
      if (!realUser || !realPath) {
        // get current user for redirect
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        window.location.replace(`/files?user=${user.id}&path=/`); // replace (not assign) avoids one extra history entry
        return; // DO NOT proceed!
      }

      // 2. Set your states from the REAL url (if you must), then load data
      setCurrentUserId(realUser);
      // setUrlUser(realUser);
      setUrlPath(realPath);

      // 3. Fetch data as normal (using realUser/realPath)
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", realUser);

      if (error) {
        setLoading(false);
        return;
      }
      const schema = buildUserSchema(data || []);
      setUserSchema(schema);
      const folderObj = getSchemaAtPath(schema, realPath);
      setNodes(getNodesAtLevel(folderObj));
      setLoading(false);
    }

    init();
    // eslint-disable-next-line
  }, [urlPath, urlUser]); // Optionally remove urlUser, urlPath from dependencies if you're only using the real ones each time

  // --- Handler: re-fetch data after creating a node ---
  const handleNodeCreated = () => {
    // Just triggers the above useEffect by setting urlUser/urlPath again
    setLoading(true);

    //temporary solution please have a better system for this
    location.reload();
    // setUrlUser((u) => u); // force re-run effect
    // setUrlPath((p) => p);
  };

  // --- UI render ---
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          <BreadCrumbs
            path={urlPath}
            onNavigate={handleBreadcrumbNavigate}
          ></BreadCrumbs>
        </h1>

        {/* Files/Folders List */}
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {nodes.map((node: NodeType) => (
            <div
              key={node.id}
              className="flex flex-col items-center justify-center bg-slate-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              style={{ width: 120, minHeight: 120 }}
              onDoubleClick={() => {
                if (node.type === "folder") {
                  // Build the new path: ensure we handle slashes gracefully
                  const nextPath =
                    urlPath === "/"
                      ? `/${node.name}`
                      : `${urlPath.replace(/\/$/, "")}/${node.name}`;
                  {
                    console.log(nextPath);
                  }
                  setUrlPath(nextPath);
                  // Update browser address bar (for refresh & sharing)
                  const params = new URLSearchParams(window.location.search);
                  params.set("path", nextPath);
                  window.history.pushState({}, "", `?${params.toString()}`);
                }
              }}
            >
              <div className="mb-2 text-6xl text-primary">
                {node.type === "folder" ? (
                  <AiOutlineFolder />
                ) : (
                  <AiOutlineFile />
                )}
              </div>
              <span className="text-sm break-all text-center text-gray-100 mt-1 unselectable">
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

      {/* Breadcrumbs */}

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
        currentPath={urlPath}
        existingFolders={getAllFolderPaths(userSchema)}
      />
    </div>
  );
}
