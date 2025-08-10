"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { FaNetworkWired } from "react-icons/fa";

const SetupPage = () => {
  const [clicked, setClicked] = useState(1);
  const [user, setUser] = useState<any>();
  const [projects, setProjects] = useState<any[]>([]);

  const supabase = createClient();

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      setUser(data.user);
      console.log(data.user);
    } else console.warn(error);
    return data;
  };

  const getUserProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id);

    if (!error) setProjects(data);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    getUserProjects();
  }, [user]);

  useEffect(() => {
    if (projects.length == 0) {
      createProject();
    }
  }, [projects]);

  const createProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: "NAME", template: {}, type: "todo" });
  };

  return (
    <div className="flex items-center justify-center h-full w-full">
      <button
        onClick={() => {
          setClicked(clicked * 2);
        }}
        // style={{ transform: `scale(${clicked})` }}
        className="create-button bg-primary-400 rounded-full cursor-pointer h-24 w-24 text-5xl flex items-center justify-center"
      >
        <FaNetworkWired></FaNetworkWired>
      </button>
    </div>
  );
};

export default SetupPage;
