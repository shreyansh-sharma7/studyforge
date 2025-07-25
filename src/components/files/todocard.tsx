import React, { useState, useEffect } from "react";
import { AiFillFolder, AiFillFile } from "react-icons/ai";
import { FiMoreVertical } from "react-icons/fi";
import { NodeType } from "../../../database.types";

import { deleteNode, updateNode } from "@/lib/files/file-actions";

interface NodeCardProps {
  node: NodeType;
  urlPath: string;
  setUrlPath: (path: string) => void;
  onNodeUpdate: (path: string, userId: string, del?: boolean) => {};
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

const TodoCard: React.FC<NodeCardProps> = ({
  node,
  urlPath,
  setUrlPath,
  onNodeUpdate,
  selected,
  setSelected,
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
      className={`hover:border-neutral-600 relative flex flex-col items-center justify-center border ${
        selected.includes(node.id)
          ? "bg-neutral-600 shadow-lg border-neutral-500"
          : "bg-neutral-800 shadow-md border-transparent"
      } hover:bg-neutral-700 rounded-lg p-2 my-2 hover:shadow-lg transition-shadow `}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => handleClick(e)}
    >
      {node.name}
    </div>
  );
};

export default TodoCard;
