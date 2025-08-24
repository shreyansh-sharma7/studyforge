"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import CreateNodeModal from "@/components/files/create-modal";
import BreadCrumbs from "@/components/files/breadcrumbs";
import NodeCard from "@/components/files/nodecard";
import { NodeType, Template } from "../../../database.types";
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
  const [peekNode, setPeekNode] = useState<NodeType | "closed">();
  const [peekState, setPeekState] = useState<"closed" | "display" | "create">(
    "closed"
  );
  const [statusList, setStatusList] = useState<string[]>([]);
  const [nodesByStatus, setNodesByStatus] = useState<
    Record<string, NodeType[]>
  >({});
  const [template, setTemplate] = useState<Template>({
    path: { data: [{}], type: "path", hidden: false },
    status: {
      data: [
        { color: "", value: "not started" },
        { color: "", value: "in progress" },
        { color: "", value: "done" },
      ],
      type: "single-select",
      hidden: false,
    },
    "date created": { data: [{}], type: "date_created", hidden: false },
  }); // State to store template data

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
      setAllNodes(Array.isArray(data) ? data : []);
      const schema = buildUserSchema(Array.isArray(data) ? data : []);
      setUserSchema(schema);

      const folderObj = getSchemaAtPath(schema, realPath);
      setNodes(getNodesAtLevel(folderObj));
      const allNodesAtPath = await getNodesFromPath(realPath, realUser);
      setAllNodesAtLevel(Array.isArray(allNodesAtPath) ? allNodesAtPath : []);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line
  }, [urlPath, urlUser]);

  // On created node, refresh schema and UI
  const handleNodeUpdate = async (
    path: string,
    userId: string,
    updateAll = false
  ) => {
    setLoading(true);
    const nodeData = !updateAll
      ? await getNodeFromPath(path, userId)
      : await getNodesFromPath(urlPath, urlUser);
    const nodeList: NodeType[] = Array.isArray(nodeData) ? nodeData : [];

    const schemaUpdated = buildUserSchema(
      nodeList,
      !updateAll ? userSchema : {}
    );

    setUserSchema(schemaUpdated);

    const folderObj = getSchemaAtPath(schemaUpdated, urlPath);
    setNodes(getNodesAtLevel(folderObj));
    setLoading(false);
  };

  const getTemplateFromUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("template")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to fetch template", error);
      return null;
    }
    return data && data.length > 0 ? data[0].template : null;
  };

  useEffect(() => {
    const init = async () => {
      // Get realUser again here for template fetch
      const params = new URLSearchParams(window.location.search);
      const realUser = params.get("user");

      if (realUser) {
        const fetchedTemplate = await getTemplateFromUser(realUser);
        if (fetchedTemplate) setTemplate(fetchedTemplate);
      }
    };

    init();
    // eslint-disable-next-line
  }, [urlPath, urlUser]);

  useEffect(() => {
    if (peekNode && peekNode.id != "createnode") {
      setPeekState("display");
    }
  }, [peekNode]);

  let view: "file" | "todo" = "todo";

  const divideBy = "status";

  useEffect(() => {
    setStatusList([]);
    template[divideBy].data.map(({ value }) => {
      setStatusList((prev) => [...prev, value!]);
    });
  }, [template]);

  useEffect(() => {
    const tempNodes = statusList.reduce((acc, status) => {
      acc[status] = nodes.filter((node) => node.metadata[divideBy] === status);
      return acc;
    }, {} as Record<string, NodeType[]>);

    setNodesByStatus(tempNodes);
  }, [statusList, template, nodes]);

  const defaultNode = () => {
    //name, type of node, if todo then from template get all the user editable tags
  };

  return (
    <div className="min-h-screen relative flex justify-center">
      <div className="w-full absolute m-6 px-4">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          <BreadCrumbs path={urlPath} onNavigate={handleBreadcrumbNavigate} />
        </h1>

        {/* Files/Folders List */}
        {view != "todo" ? (
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
                view={view}
              />
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-3 px-4`}
            style={{
              gridTemplateColumns: `repeat(${statusList.length}, minmax(0, 1fr))`,
            }}
          >
            {statusList.map((status) => (
              <div
                key={status}
                className="p-3 bg-neutral-800/50 rounded text-center"
              >
                <h1 className="text-xl mb-4">{status}</h1>
                {nodesByStatus[status] ? (
                  nodesByStatus[status].map((node) => {
                    return (
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
                        view={view}
                      />
                    );
                  })
                ) : (
                  <div></div>
                )}
              </div>
            ))}
            {/* {nodes.map((node) => (
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
                view={view}
              />
            ))} */}
          </div>
        )}

        {!loading && nodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {/* No files or folders yet. Create your first one! */}
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => {
          setPeekState("create");
          setPeekNode({
            user_id: currentUserId,
            name: "",
            metadata: {},
            type: "todo",
            path: urlPath == "/" ? "" : "/" + "Empty/",
            created_at: new Date().toISOString(),
            parent_id: null,
            username: null,
            id: "createnode",
          });
          //user_id, name, type, path, metadata
        }}
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
      {/* <CreateNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNodeCreated={handleNodeUpdate}
        userId={currentUserId}
        username={currentUsername}
        currentPath={urlPath}
        existingFolders={getAllFolderPaths(userSchema)}
      /> */}

      {peekNode && (
        <Peek
          peekState={peekState}
          onClose={() => {
            setPeekState("closed");
            setPeekNode("closed");
          }}
          node={peekNode}
          onNodeUpdate={handleNodeUpdate}
          // onNodeCreate={handleNodeCreate}
          template={template}
        />
      )}
    </div>
  );
};

export default FileSystemPage;
