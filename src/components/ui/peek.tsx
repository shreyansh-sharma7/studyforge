"use client";

import React, { useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { NodeType } from "../../../database.types";
import { resolveTemplate } from "@/lib/utils";
import { ContextMenu } from "./context-menu";
import { ContextItem } from "./context-item";
import { MenuContext } from "@/lib/contexts";
import { updateNode } from "@/lib/files/file-actions";

type PeekProps = {
  isOpen: boolean; // Controls the visibility of the panel
  node: NodeType; // The node object containing data to display
  onClose: () => void; // Callback function to close the panel
};

type Template = {
  [key: string]: {
    type: "single-select" | "path" | "date_created" | "text";
    hidden: boolean;
    values: string[];
  };
};

const Peek = ({ isOpen, onClose, node }: PeekProps) => {
  const { contextMenuKey, setContextMenuKey } = useContext(MenuContext);
  const [template, setTemplate] = useState<Template>({
    path: { type: "path", hidden: false, values: [] },
    status: {
      type: "single-select",
      hidden: false,
      values: ["not started", "in progress", "done"],
    },
    "date created": { type: "date_created", hidden: false, values: [] },
  }); // State to store template data

  const [nodeTemplated, setNodeTemplated] = useState<{
    [key: string]: any;
  }>({});

  // Do not render the component if the panel should be hidden
  if (!isOpen) return null;

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
        setTemplate(templateData);
      }
    };

    fetchTemplate();
  }, [node.user_id, node.path]);

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

  const handlePropContextClick = (propName: string, newValue: any) => {
    if (template[propName].type == "single-select") {
      //update node metadata  to the new value thats been clicked
      node.metadata[propName] = newValue;

      setNodeTemplated((prev) => ({ ...prev, [propName]: newValue }));

      updateNode(node);
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-2/5 bg-neutral-800 z-30 pl-8 pt-8 shadow-lg border-l-2 overflow-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close panel"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-100 transition-colors text-2xl font-bold"
      >
        &times;
      </button>

      {/* Node name displayed as heading */}
      <h1 className="text-font-primary text-5xl font-medium mb-6">
        {node.name}
      </h1>

      {/* Key properties of the node */}
      <div className="propertiescont space-y-1">
        {Object.keys(nodeTemplated).map((propName) => (
          <div className="property flex gap-4 text-sm items-center">
            <div className="key w-36 hover:bg-neutral-700 rounded p-2">
              {propName}
            </div>
            {contextMenuKey != `prop_${node.id}_${propName}` && (
              <div
                onClick={() => handlePropValueClick(propName)}
                className="value min-w-56 hover:bg-neutral-700 rounded p-2"
              >
                <div>{nodeTemplated[propName]}</div>
              </div>
            )}

            {contextMenuKey == `prop_${node.id}_${propName}` && (
              <div
                onClick={() => handlePropValueClick(propName)}
                className="value min-w-56 rounded"
              >
                <div className="bg-zinc-600 border-b-1 border-zinc-500 p-2 rounded-t text-sm">
                  <span className="bg-cyan-700 p-1 rounded font-bold">
                    {nodeTemplated[propName]}
                  </span>
                </div>
                <div className="p-1 absolute bg-zinc-700 min-w-56">
                  <ContextMenu key={`prop_${node.id}_${propName}`}>
                    {template[propName].values.map((value) => {
                      return (
                        <ContextItem
                          title={value}
                          onclick={() => {
                            handlePropContextClick(propName, value);
                          }}
                        ></ContextItem>
                      );
                    })}
                  </ContextMenu>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { Peek };
