import React, { useEffect, useContext } from "react";
import { AiFillFolder, AiFillFile } from "react-icons/ai";
import { FiMoreVertical } from "react-icons/fi";
import { NodeType } from "../../../database.types";

import { ContextMenu } from "../ui/context-menu";
import { MenuContext } from "@/lib/contexts";
import { ContextItem } from "../ui/context-item";
import { deleteNode } from "@/lib/files/file-actions";

interface NodeCardProps {
  node: NodeType;
  urlPath: string;
  setUrlPath: (path: string) => void;
  onNodeUpdate: (path: string, userId: string, del?: boolean) => {};
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  peekNode: NodeType | "closed";
  setPeekNode: React.Dispatch<
    React.SetStateAction<NodeType | "closed" | undefined>
  >;
  view: "file" | "todo";
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  urlPath,
  setUrlPath,
  onNodeUpdate,
  selected,
  setSelected,
  peekNode,
  setPeekNode,
  view,
}) => {
  // Consume shared menu context for open menu key and updater
  const { contextMenuKey, setContextMenuKey } = useContext(MenuContext);

  // Toggle context menu open/close for this node
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent's double click
    setContextMenuKey(
      contextMenuKey === `node_${node.id}` ? "" : `node_${node.id}`
    );
  };

  // Close menu when clicking outside

  // fix later

  // useEffect(() => {
  //   if (!contextMenuKey) return;

  //   const handleClickOutside = () => setContextMenuKey("");
  //   window.addEventListener("click", handleClickOutside);
  //   return () => window.removeEventListener("click", handleClickOutside);
  // }, [contextMenuKey, setContextMenuKey]);

  // Handle double click: navigate if folder, or open peek for todo
  const handleDoubleClick = () => {
    if (node.type === "folder") {
      const nextPath =
        urlPath === "/"
          ? `/${node.name}`
          : `${urlPath.replace(/\/$/, "")}/${node.name}`;
      setUrlPath(nextPath);

      // Update URL query params with new path
      const params = new URLSearchParams(window.location.search);
      params.set("path", nextPath);
      window.history.pushState({}, "", `?${params.toString()}`);
    } else if (node.type === "todo") {
      setPeekNode(node);
    }
  };

  // Handle click for single or multi-selection of nodes
  const handleClick = (e: React.MouseEvent) => {
    const isMultiSelect = e.ctrlKey || e.metaKey;
    setSelected((prev) =>
      isMultiSelect
        ? prev.includes(node.id)
          ? prev
          : [...prev, node.id]
        : [node.id]
    );
  };

  return (
    <div>
      {view == "file" ? (
        <div
          key={node.id}
          className={`hover:border nodecard relative flex flex-col items-center justify-center ${
            selected.includes(node.id)
              ? "bg-neutral-700 shadow-lg border"
              : "bg-transparent shadow-md"
          } hover:bg-neutral-800 rounded-lg p-4 hover:shadow-lg transition-shadow`}
          style={{ width: 160, height: 160 }}
          onDoubleClick={handleDoubleClick}
          onClick={handleClick}
        >
          {/* Button to toggle context menu */}
          <button
            onClick={toggleMenu}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700"
            aria-label="Open menu"
          >
            <FiMoreVertical className="kebab-buttons text-gray-300" />
          </button>

          {/* Conditionally render context menu if this node's menu is open */}
          {contextMenuKey === `node_${node.id}` && (
            <ContextMenu key={`node_${node.id}`}>
              <ContextItem
                title="Delete"
                onclick={async () => {
                  setContextMenuKey("");
                  await deleteNode(node);
                  onNodeUpdate(node.path, node.user_id!, true);
                }}
              ></ContextItem>
            </ContextMenu>
          )}

          {/* Icon based on node type */}
          <div className="text-9xl text-primary-400 pointer-events-none">
            {node.type === "folder" ? <AiFillFolder /> : <AiFillFile />}
          </div>

          {/* Node name */}
          <span className="-mt-1 text-sm break-words text-center text-gray-100 unselectable pointer-events-none">
            {node.name}
          </span>
        </div>
      ) : (
        <div
          key={node.id}
          className={`hover:border-neutral-600 relative flex flex-col items-center justify-center border ${
            selected.includes(node.id)
              ? "bg-neutral-600 shadow-lg border-neutral-500"
              : "bg-neutral-800 shadow-md border-transparent"
          } hover:bg-neutral-700 rounded-lg p-2 my-2 hover:shadow-lg transition-shadow `}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => handleClick(e)}
        >
          <span className="unselectable">{node.name}</span>
        </div>
      )}
    </div>
  );
};

export default NodeCard;
