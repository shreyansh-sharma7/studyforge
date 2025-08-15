"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/files/create-modal";
import BreadCrumbs from "@/components/files/breadcrumbs";
import NodeCard from "@/components/files/nodecard";
import { NodeType } from "../../../database.types";
import TodoCard from "@/components/files/todocard";
import { Peek } from "@/components/ui/peek";

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
  const [allNodes, setAllNodes] = useState<NodeType[]>([]);
  const [allNodesAtLevel, setAllNodesAtLevel] = useState<NodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlUser, setUrlUser] = useState<string>("");
  const [urlPath, setUrlPath] = useState<string>("/");
  const [selected, setSelected] = useState<string[]>([]);
  const [peekNode, setPeekNode] = useState<NodeType>();
  const [isPeekOpen, setIsPeekOpen] = useState(false);

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
      setAllNodes(data);
      const schema = buildUserSchema(data || []);
      setUserSchema(schema);

      const folderObj = getSchemaAtPath(schema, realPath);
      setNodes(getNodesAtLevel(folderObj));
      const allNodesAtPath = await getNodesFromPath(realPath, realUser);
      setAllNodesAtLevel(allNodesAtPath);
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

    console.log(nodeList);
    const schemaUpdated = buildUserSchema(
      nodeList,
      !updateAll ? userSchema : {}
    );

    console.log(schemaUpdated);

    setUserSchema(schemaUpdated);

    const folderObj = getSchemaAtPath(schemaUpdated, urlPath);
    setNodes(getNodesAtLevel(folderObj));
    setLoading(false);
  };

  const normalizedNodes = nodes.map((node) => ({
    ...node,
    status: node.metadata.status?.toLowerCase().trim() || "not started",
  }));
  const normalizedNodes2 = allNodesAtLevel
    .filter((node) => {
      return (
        node.type == "todo" ||
        `${urlPath == "/" ? "" : urlPath}/${node.name}/` == node.path
      );
    })
    .map((node) => {
      if (node.type === "todo") {
        return {
          ...node,
          status: node.metadata.status?.toLowerCase().trim() || "not started",
        };
      } else {
        return {
          ...node,
          status: "Folders", // or keep whatever you'd like for other types
        };
      }
    });

  const uniqueStatuses = Array.from(
    new Set(normalizedNodes2.map((node) => node.status))
  );

  const nodesByStatus: Record<string, NodeType[]> = uniqueStatuses.reduce(
    (acc, status) => {
      acc[status] = normalizedNodes2.filter((node) => node.status === status);
      return acc;
    },
    {} as Record<string, NodeType[]>
  );

  useEffect(() => {
    if (peekNode) {
      setIsPeekOpen(true);
    }
  }, [peekNode]);

  const todo = false;
  return (
    <div className="min-h-screen relative">
      <div className="w-full absolute m-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          <BreadCrumbs path={urlPath} onNavigate={handleBreadcrumbNavigate} />
        </h1>

        {/* Files/Folders List */}

        {todo == false ? (
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
                peekNode={peekNode!}
                setPeekNode={setPeekNode}
              />
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-${uniqueStatuses.length} gap-6`}
          >
            {uniqueStatuses.map((status) => (
              <div key={status} className="bg-zinc-900 rounded p-4">
                <h2 className="text-lg font-semibold mb-4 capitalize">
                  {status}
                </h2>
                {nodesByStatus[status].length === 0 ? (
                  <p className="text-gray-400">No items</p>
                ) : (
                  nodesByStatus[status].map((node) => (
                    <TodoCard
                      key={node.id}
                      node={node}
                      urlPath={urlPath}
                      setUrlPath={setUrlPath}
                      onNodeUpdate={handleNodeUpdate}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  ))
                )}
              </div>
            ))}
          </div>

          // <div className="grid grid-cols-3 gap-4">
          //   <div className="">
          //     <div className="text-center text-2xl">Not Started</div>
          //   </div>
          //   <div className="text-center">In Progress</div>
          //   <div className="text-center">Done</div>
          //   {nodes.map((node) => (
          //     <TodoCard
          //       key={node.id}
          //       node={node}
          //       urlPath={urlPath}
          //       setUrlPath={setUrlPath}
          //       onNodeUpdate={handleNodeUpdate}
          //       selected={selected}
          //       setSelected={setSelected}
          //     ></TodoCard>
          //   ))}
          // </div>
        )}

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
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors z-20"
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
      {isPeekOpen ? (
        <Peek
          isOpen={isPeekOpen}
          onClose={() => setIsPeekOpen(false)}
          node={peekNode!}
          onNodeUpdate={handleNodeUpdate}
        ></Peek>
      ) : (
        ""
      )}
    </div>
  );
};

export default FileSystemPage;
