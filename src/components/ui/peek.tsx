"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { NodeType } from "../../../database.types";

type PeekProps = {
  isOpen: boolean;
  node: NodeType;
  onClose: () => void;
};

const Peek = ({ isOpen, onClose, node }: PeekProps) => {
  const [template, setTemplate] = useState<any[]>([]);

  // Do not render the component if closed
  if (!isOpen) return null;

  // Format creation date nicely
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const creation_date = new Date(node.created_at).toLocaleString(
    "en-US",
    options
  );

  // Create supabase client, server side
  const supabase = createClient();

  // Fetch template data related to this node’s user and path
  const getTemplateFromUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch template", error);
      return;
    }
    return data[0].template;
  };

  useEffect(() => {
    if (!node.user_id) return; // guard condition

    const fetchTemplate = async () => {
      const templateData = await getTemplateFromUser(node.user_id!);
      if (templateData) {
        setTemplate(templateData);
        console.log(templateData);
      }
    };

    fetchTemplate();
  }, [node.user_id, node.path]);

  useEffect(() => {
    const templateResolver = () => {
      for (const property in template) {
        console.log(property);
      }
    };
    templateResolver();
  }, [template]);

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

      <h1 className="text-font-primary text-5xl font-medium mb-6">
        {node.name}
      </h1>

      <div className="propertiescont space-y-1">
        <div className="property flex gap-4">
          <div className="key w-36 hover:bg-neutral-700 rounded p-2">
            Date Created
          </div>
          <div className="value min-w-36 hover:bg-neutral-700 rounded p-2">
            {creation_date}
          </div>
        </div>

        <div className="property flex gap-4">
          <div className="key w-36 hover:bg-neutral-700 rounded p-2">
            Status
          </div>
          <div className="value min-w-36 hover:bg-neutral-700 rounded p-2">
            {node.metadata?.status || "Unknown"}
          </div>
        </div>

        <div className="property flex gap-4">
          <div className="key w-36 hover:bg-neutral-700 rounded p-2">Path</div>
          <div className="value min-w-36 hover:bg-neutral-700 rounded p-2">
            {node.path}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Peek };
