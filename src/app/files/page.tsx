"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/files/create-modal";
import BreadCrumbs from "@/components/files/breadcrumbs";
import NodeCard from "@/components/files/nodecard";
import { NodeType } from "../../../database.types";

// --- Utilities ---

const getNodesAtLevel = (folder: any): NodeType[] => {
  if (!folder) return [];
  return Object.keys(folder)
    .filter((key) => key !== "_data")
    .map((key) => folder[key]._data);
};

const getSchemaAtPath = (schema: any, path: string): any => {
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
};

const buildUserSchema = (flatNodes: NodeType[], givenSchema = {}): any => {
  const schema = JSON.parse(JSON.stringify(givenSchema));
  flatNodes.forEach((node) => {
    const parts = node.path.replace(/^\/|\/$/g, "").split("/");
    let curr: any = schema;
    for (const part of parts) {
      if (!curr[part]) curr[part] = { _data: undefined };
      curr = curr[part];
    }
    curr._data = node;
  });
  return schema;
};

const getAllFolderPaths = (
  schema: any,
  currentPath = "",
  acc: string[] = []
): string[] => {
  if (!schema) return acc;
  if (schema._data?.type === "folder" || currentPath === "") {
    acc.push(currentPath === "" ? "/" : currentPath);
    Object.keys(schema)
      .filter((key) => key !== "_data")
      .forEach((key) =>
        getAllFolderPaths(
          schema[key],
          `${currentPath === "" ? "" : currentPath}/` + key,
          acc
        )
      );
  }
  return acc;
};

// --- Main Component ---

const FileSystemPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [userSchema, setUserSchema] = useState<any>(null);
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlUser, setUrlUser] = useState<string>("");
  const [urlPath, setUrlPath] = useState<string>("/");
  const [selected, setSelected] = useState<string[]>([]);

  const supabase = createClient();

  // Breadcrumb click handler
  const handleBreadcrumbNavigate = (crumbPath: string) => {
    setUrlPath(crumbPath);
    const params = new URLSearchParams(window.location.search);
    params.set("path", crumbPath);
    window.history.pushState({}, "", `?${params.toString()}`);
  };

  // Fetch node with exact path
  const getNodeFromPath = async (path: string, userId = currentUserId) => {
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("path", path)
      .eq("user_id", userId);
    return error ? error : data;
  };

  // Fetch all nodes under a specific path
  const getNodesFromPath = async (path: string, userId = currentUserId) => {
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .like("path", `${path}%`)
      .eq("user_id", userId);
    return error ? error : data;
  };

  // On mount: extract URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUrlUser(params.get("user") || "");
      setUrlPath(params.get("path") || "/");
    }
  }, []);

  // On user/path change: fetch schema and nodes
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const realUser = params.get("user");
      const realPath = params.get("path");

      // Redirect if not logged in or missing params
      if (!realUser || !realPath) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          window.location.replace(`/auth/login`);
          return;
        }
        window.location.replace(`/files?user=${user.id}&path=/`);
        return;
      }

      setCurrentUserId(realUser);
      setUrlUser(realUser);
      setUrlPath(realPath);

      const data = await getNodesFromPath("/", realUser);
      const schema = buildUserSchema(data || []);
      setUserSchema(schema);

      const folderObj = getSchemaAtPath(schema, realPath);
      setNodes(getNodesAtLevel(folderObj));
      setLoading(false);
    };

    init();
    // eslint-disable-next-line
  }, [urlPath, urlUser]);

  // On created node, refresh schema and UI
  //when updateAll=true then refreshes the whole userschema else just adds the node
  // also handles deletes
  const handleNodeUpdate = async (
    path: string,
    userId: string,
    updateAll = false
  ) => {
    setLoading(true);
    const nodeList: NodeType[] = !updateAll
      ? await getNodeFromPath(path, userId)
      : await getNodesFromPath(urlPath, urlUser);

    const schemaUpdated = buildUserSchema(
      nodeList,
      !updateAll ? userSchema : {}
    );

    setUserSchema(schemaUpdated);

    const folderObj = getSchemaAtPath(schemaUpdated, urlPath);
    setNodes(getNodesAtLevel(folderObj));
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          <BreadCrumbs path={urlPath} onNavigate={handleBreadcrumbNavigate} />
        </h1>

        {/* Files/Folders List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              urlPath={urlPath}
              setUrlPath={setUrlPath}
              onNodeUpdate={handleNodeUpdate}
              selected={selected}
              setSelected={setSelected}
            />
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
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors z-50"
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

      {/* Create Node Modal */}
      <CreateNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNodeCreated={handleNodeUpdate}
        userId={currentUserId}
        username={currentUsername}
        currentPath={urlPath}
        existingFolders={getAllFolderPaths(userSchema)}
      />
    </div>
  );
};

export default FileSystemPage;
