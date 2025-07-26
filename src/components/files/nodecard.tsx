import React, { useState, useEffect } from "react";
import { AiFillFolder, AiFillFile } from "react-icons/ai";
import { FiMoreVertical } from "react-icons/fi";
import { NodeType } from "../../../database.types";

import { deleteNode, updateNode } from "@/lib/files/file-actions";
import { EditNode } from "./edit-node";

interface NodeCardProps {
  node: NodeType;
  urlPath: string;
  setUrlPath: (path: string) => void;
  onNodeUpdate: (path: string, userId: string, del?: boolean) => {};
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  peekNode: NodeType;
  setPeekNode: React.Dispatch<React.SetStateAction<NodeType | undefined>>;
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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent also triggering parent's double click
    setMenuOpen((open) => !open);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const handleDoubleClick = () => {
    if (node.type === "folder") {
      const nextPath =
        urlPath === "/"
          ? `/${node.name}`
          : `${urlPath.replace(/\/$/, "")}/${node.name}`;

      setUrlPath(nextPath);

      const params = new URLSearchParams(window.location.search);
      params.set("path", nextPath);
      window.history.pushState({}, "", `?${params.toString()}`);
    } else if (node.type == "todo") {
      setPeekNode(node);
    }
  };

  const handleClick = (e) => {
    const isMultiSelect = e.ctrlKey || e.metaKey;
    setSelected((prev) => {
      if (isMultiSelect) {
        // Add nodeId if not already selected
        return prev.includes(node.id) ? prev : [...prev, node.id];
      } else {
        // Single select mode
        return [node.id];
      }
    });
  };

  return (
    <div
      key={node.id}
      className={`hover:border nodecard relative flex flex-col items-center justify-center ${
        selected.includes(node.id)
          ? "bg-neutral-700 shadow-lg border"
          : "bg-transparent shadow-md"
      } hover:bg-neutral-800 rounded-lg p-4 hover:shadow-lg transition-shadow`}
      style={{ width: 160, height: 160 }}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => handleClick(e)}
    >
      {/* 3 dots button */}
      <button
        onClick={toggleMenu}
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700"
        aria-label="Open menu"
      >
        <FiMoreVertical className="kebab-buttons text-gray-300" />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          className="absolute top-8 right-2 z-50 w-32 bg-neutral-800 rounded shadow-md text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-3 py-2 hover:bg-neutral-700"
            onClick={async () => {
              setMenuOpen(false);
              await deleteNode(node);
              onNodeUpdate(node.path, node.user_id!, true);
            }}
          >
            Delete
          </button>
          <button
            className="block w-full text-left px-3 py-2 hover:bg-neutral-700"
            onClick={async () => {
              setMenuOpen(false);
              node.name = "gang";
              node.path = "/gang/";
              await updateNode(node);
              // onNodeUpdate(node.path, node.user_id!, true);
            }}
          >
            Rename
          </button>
          {/* Add more menu options below if needed */}
        </div>
      )}

      {/* Icon */}
      <div className="text-9xl text-primary-400 pointer-events-none">
        {node.type === "folder" ? <AiFillFolder /> : <AiFillFile />}
      </div>

      {/* Name */}
      <span className="-mt-1 text-sm break-words text-center text-gray-100 unselectable pointer-events-none">
        {node.name}
      </span>
    </div>
  );
};

export default NodeCard;
