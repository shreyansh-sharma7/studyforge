"use client";

import React, { useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { NodeType, Template } from "../../../database.types";
import { colorClassMap, resolveTemplate } from "@/lib/utils";
import { ContextMenu } from "./context-menu";
import { ContextItem } from "./context-item";
import { MenuContext } from "@/lib/contexts";
import { deleteNode, updateNode } from "@/lib/files/file-actions";
import Input from "./input";
import { MdSaveAs } from "react-icons/md";

type PeekProps = {
  peekState: "closed" | "create" | "display"; // Controls the visibility of the panel
  node: NodeType; // The node object containing data to display
  onClose: () => void; // Callback function to close the panel
  onNodeUpdate: (path: string, userId: string, updateAll?: boolean) => void;
  template: Template;
};

const Peek = ({
  peekState,
  onClose,
  node,
  onNodeUpdate,
  template,
}: PeekProps) => {
  const { contextMenuKey, setContextMenuKey } = useContext(MenuContext);

  const [nodeTemplated, setNodeTemplated] = useState<{
    [key: string]: any;
  }>({});

  const [nodeName, setNodeName] = useState(node.name);

  const [showSave, setShowSave] = useState(true); //for now jsut kept it always visible

  const [createPropertyName, setCreatePropertyName] = useState("");

  // Do not render the component if the panel should be hidden
  const isClosed = peekState === "closed";

  useEffect(() => {
    const handleEscEnter = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(); // Close the Peek panel
      } else if (event.key == "Enter") {
        handleEditSubmit();
      }
    };

    window.addEventListener("keydown", handleEscEnter);

    return () => {
      window.removeEventListener("keydown", handleEscEnter);
    };
  }, [onClose]);

  // Create a Supabase client instance
  const supabase = createClient();

  // Fetch the template data associated with the node's user from Supabase
  const getTemplateFromUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch template", error);
      return;
    }
    return data && data.length > 0 ? data[0].template : null;
  };

  // On every user or path change, fetch the relevant template data
  useEffect(() => {
    if (!node.user_id) return;

    const fetchTemplate = async () => {
      const templateData = await getTemplateFromUser(node.user_id!);
      if (templateData) {
        template = templateData;
      }
    };
    setNodeName(node.name);
    fetchTemplate();
  }, [node.user_id, node.id]);

  // Effect for resolving or processing template data
  useEffect(() => {
    setNodeTemplated(resolveTemplate(template, node));
  }, [template, node]);

  const handlePropValueClick = (propName: string) => {
    if (template[propName].type == "single-select") {
      setContextMenuKey(`prop_${node.id}_${propName}`);
    } else {
      setContextMenuKey("");
    }
    //single select
  };

  const handlePropContextClick = (
    propName: string,
    newValue: any,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (template[propName].type == "single-select") {
      //update node metadata  to the new value thats been clicked
      node.metadata[propName] = newValue;

      setNodeTemplated((prev) => ({ ...prev, [propName]: newValue }));

      setContextMenuKey("");

      updateNode(node).then(() => {
        onNodeUpdate(node.path, node.user_id!);
      });
    }
  };

  useEffect(() => {
    node.name = nodeName;
    console.log(node.path);
    const parentPath = `/${node.path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .slice(0, -1)
      .join("/")}/`;
    node.path = parentPath + nodeName + "/";

    // updateNode(node);
  }, [nodeName]);

  const checkIfNodeExists = async () => {
    // copied from files page.tsx cause im lazy to refactor it
    //check if renamed path doesnt already exist
    const getNodeFromPath = async (path: string, userId = node.user_id) => {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .eq("path", path);
      return error ? [] : data;
    };
    const nodeAtPath = await getNodeFromPath(node.path, node.user_id);

    if (nodeAtPath.length > 0) {
      //means there is a node with the same path
      if (nodeAtPath[0].id != node.id) {
        //means we are trying to create a new node with the same path (not allowed)
        console.log("bad boy trying to create same bad bad");
        return true;
      }
    }
    //does not exist
    return false;
  };

  const handleEditSubmit = async () => {
    if ((await checkIfNodeExists()) == false) {
      await updateNode(node);
      onNodeUpdate(node.path, node.user_id!, true); //lil bug here doesnt work without update all
      setNodeTemplated(resolveTemplate(template, node));
    }
  };

  const handleCreateSubmit = async () => {
    console.log(node);
    if ((await checkIfNodeExists()) == false) {
      //done: user_id, name, metadata
      //left: type, path, dont allow submit for edge cases
      //for now lets only have todo type

      node.type = "todo";
      const nodeCopy: Partial<NodeType> = node;
      delete nodeCopy["id"];

      const { error: insertError } = await supabase
        .from("nodes")
        .insert([nodeCopy]);
      if (insertError) throw insertError;

      onNodeUpdate(node.path, node.user_id!);
      setNodeTemplated(resolveTemplate(template, node));
      onClose();
    }
  };

  const createProperty = async (
    name: string,
    type: "single-select" | "text",
    data: Array<{ value?: string; color?: string }>
  ) => {
    if (template[name] != null) {
      console.warn("Property Already Exists");
    } else {
      template[name] = { type, data, hidden: false };
      await updateTemplate(template, node.user_id!);
      setNodeTemplated(resolveTemplate(template, node));
      setContextMenuKey(`prop_${node.id}_${name}`);
      setCreatePropertyName("");
    }
  };

  const updateTemplate = async (template: Template, user_id = node.user_id) => {
    const { data, error } = await supabase
      .from("projects")
      .update({ template: template })
      .eq("user_id", user_id);
  };

  const addPropertyValue = async (
    template: Template,
    propertyName: string,
    propertyValue: any
  ) => {
    if (
      !template[propertyName].data.some((item) => item.value === propertyValue)
    )
      template[propertyName].data.push({ value: propertyValue, color: "" });
    else {
      console.warn("Value on this property already exists");
    }
    updateTemplate(template);
  };

  return isClosed ? null : (
    <div className="fixed top-0 right-0 h-full w-2/5 bg-neutral-800 z-30 pl-8 pt-8 shadow-lg border-l-2 overflow-auto unselectable">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close panel"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-100 transition-colors text-2xl font-bold"
      >
        &times;
      </button>

      {showSave && (
        <button
          onClick={
            peekState == "create" ? handleCreateSubmit : handleEditSubmit
          }
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors z-40 text-2xl"
        >
          <MdSaveAs />
        </button>
      )}

      {/* Node name displayed as heading */}
      <input
        className="text-font-primary text-5xl font-medium mb-6 focus:outline-0 focus"
        value={nodeName}
        onChange={(e) => setNodeName(e.target.value)}
      />

      {/* Key properties of the node */}
      <div className="propertiescont space-y-1">
        {Object.keys(nodeTemplated).map((propName) => (
          <div>
            {!template[propName].hidden && (
              <div
                key={`prop_${node.id}_${propName}`}
                className="property flex gap-4 text-sm items-center"
              >
                <div className="key w-36 hover:bg-neutral-700 rounded p-2">
                  {propName}
                </div>
                {contextMenuKey != `prop_${node.id}_${propName}` && (
                  <div
                    onClick={() => handlePropValueClick(propName)}
                    className="value min-w-56 hover:bg-neutral-700 rounded p-2 "
                  >
                    <div>
                      {nodeTemplated[propName] ? (
                        <span
                          className={`rounded focus:outline-0 w-32 p-1 text-sm ${(() => {
                            if (nodeTemplated[propName]) {
                              const match = template[propName].data.find(
                                (item) => item.value === nodeTemplated[propName]
                              );
                              if (match && match.color !== undefined)
                                return colorClassMap[
                                  match.color as keyof typeof colorClassMap
                                ];
                            }
                            return "";
                          })()}`}
                        >
                          {nodeTemplated[propName]}
                        </span>
                      ) : (
                        <span className="text-gray-500">Empty</span>
                      )}
                    </div>
                  </div>
                )}

                {contextMenuKey == `prop_${node.id}_${propName}` && (
                  <div
                    onClick={() => handlePropValueClick(propName)}
                    className="value min-w-56 rounded"
                  >
                    <div className="bg-zinc-600 border-b-1 border-zinc-500 p-2 rounded-t text-sm ">
                      <span
                        className={`rounded focus:outline-0 w-32 text-gray-400 p-1 text-sm ${(() => {
                          if (nodeTemplated[propName]) {
                            const match = template[propName].data.find(
                              (item) => item.value === nodeTemplated[propName]
                            );
                            if (match && match.color !== undefined)
                              return colorClassMap[
                                match.color as keyof typeof colorClassMap
                              ];
                          }
                          return "";
                        })()} font-bold text-white`}
                      >
                        {nodeTemplated[propName]
                          ? nodeTemplated[propName]
                          : "Empty"}
                      </span>
                    </div>
                    <div className="p-1 absolute bg-zinc-700 min-w-56 rounded-b">
                      <ContextMenu key={`prop_${node.id}_${propName}`}>
                        {template[propName].data
                          .map((item) => [item.value, item.color])
                          .map(([value, color]) => {
                            return (
                              <ContextItem
                                key={`prop_${node.id}_${propName}_${value}`}
                                title={value!}
                                onclick={(e) => {
                                  handlePropContextClick(propName, value, e!);
                                }}
                                color={color}
                              ></ContextItem>
                            );
                          })}
                        <ContextItem
                          key={`input_${node.id}_${propName}`}
                          title="+ Add Option"
                          type="input"
                          onclick={(value) => {
                            addPropertyValue(template, propName, value);
                          }}
                        ></ContextItem>
                      </ContextMenu>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div className="property flex gap-4 text-sm items-center">
          {contextMenuKey != `createprop_${node.id}` && (
            <div
              onClick={() => {
                setContextMenuKey(`createprop_${node.id}`);
              }}
              className="key w-36 hover:bg-neutral-700 rounded p-2 text-gray-500 hover:text-white"
            >
              + Add Property
            </div>
          )}

          {contextMenuKey == `createprop_${node.id}` && (
            <div className="">
              <div className="value w-36 rounded">
                <div className="bg-zinc-600 border-b-1 border-zinc-500 p-2 rounded-t text-sm">
                  <input
                    placeholder="Property Name"
                    className="rounded focus:outline-0 w-32"
                    value={createPropertyName}
                    onChange={(e) => {
                      setCreatePropertyName(e.target.value);
                    }}
                  ></input>
                </div>
                <div className="p-1 absolute bg-zinc-700 w-36 rounded-b">
                  <ContextMenu key={`createprop_${node.id}`}>
                    <ContextItem
                      title="Single Select"
                      onclick={(e) => {
                        createProperty(createPropertyName, "single-select", []);
                      }}
                    ></ContextItem>
                    <ContextItem title="Text" onclick={(e) => {}}></ContextItem>
                  </ContextMenu>
                </div>
              </div>
            </div>
          )}
        </div>
        {peekState == "display" && (
          <div className="property flex gap-4 text-sm items-center">
            <div
              onClick={() => {
                deleteNode(node).then(() =>
                  onNodeUpdate(node.path, node.user_id!, true)
                );
                // setContextMenuKey(`createprop_${node.id}`);
              }}
              className="key w-36 hover:bg-red-400/20 rounded p-2 text-red-500/60 hover:text-red-500"
            >
              Delete
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Peek };
