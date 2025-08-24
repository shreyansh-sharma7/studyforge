"use client";
import { ColorContext, MenuContext } from "@/lib/contexts";
import { useState, useEffect } from "react";

export default function FilesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contextMenuKey, setContextMenuKey] = useState("");
  const [colorTheme, setColorTheme] = useState<string>("slate"); // Always string

  // Only runs on the client
  useEffect(() => {
    const color = localStorage.getItem("color");
    if (color) {
      setColorTheme(color);
    }
  }, []);

  return (
    <ColorContext.Provider value={{ colorTheme, setColorTheme }}>
      <MenuContext.Provider value={{ contextMenuKey, setContextMenuKey }}>
        <div data-theme={colorTheme}>{children}</div>
      </MenuContext.Provider>
    </ColorContext.Provider>
  );
}
