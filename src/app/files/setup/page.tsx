"use client";

import { createClient } from "@/lib/client";
import { ColorContext } from "@/lib/contexts";
import { colorClassMap } from "@/lib/utils";
import { redirect, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FaNetworkWired } from "react-icons/fa";

const SetupPage = () => {
  const [clicked, setClicked] = useState(0);
  const [user, setUser] = useState<any>();
  const [projects, setProjects] = useState<any[]>([]);

  const supabase = createClient();

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      setUser(data.user);
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
    if (user) getUserProjects();
  }, [user]);

  // useEffect(() => {
  //   // if (projects.length == 0) {
  //   //   createProject();
  //   // }
  // }, [projects]);

  useEffect(() => {
    setColorTheme(colors[clicked]);
    if (clicked >= colors.length) {
      setClicked(0);
      setColorTheme(colors[0]);
    }
  }, [clicked]);

  const createProject = async (color: string) => {
    if (projects.length === 0) {
      if (user) {
        const { data, error } = await supabase.from("projects").insert({
          user_id: user.id,
          name: "NAME",
          template: {
            path: { data: [{}], type: "path", hidden: true },
            status: {
              data: [
                { color: "red", index: 1, value: "not started" },
                { color: "cyan", index: 2, value: "in progress" },
                { color: "green", index: 3, value: "done" },
              ],
              type: "single-select",
              hidden: false,
            },
            "date created": { data: [{}], type: "date_created", hidden: false },
          },
          type: "todo",
          color,
        });
      }
    }

    localStorage.setItem("color", color);
  };
  const { colorTheme, setColorTheme } = useContext(ColorContext);
  const colors = Object.keys(colorClassMap);
  // setColorTheme(colors[0]);

  const router = useRouter();

  return (
    <div className="antialiased min-h-screen overflow-y-hidden h-full dark overflow-x-hidden">
      <div className="flex items-center justify-center min-h-screen w-full flex-col">
        <div>click on the button to cycle through colors (doesnt work rn) </div>
        <button
          onClick={() => {
            // setClicked(clicked * 2);
            setClicked(clicked + 1);
          }}
          // style={{ transform: `scale(${clicked})` }}
          className="my-8 create-button bg-primary-400 rounded-full cursor-pointer h-24 w-24 text-5xl flex items-center justify-center"
        >
          <FaNetworkWired></FaNetworkWired>
        </button>
        <button
          onClick={() => {
            // if (projects.length == 0) {
            createProject(colors[clicked]);
            // }
            redirect("/files");
          }}
          className="bg-primary-800 rounded p-2"
        >
          submit {colors[clicked]}
        </button>
      </div>
    </div>
  );
};

export default SetupPage;
