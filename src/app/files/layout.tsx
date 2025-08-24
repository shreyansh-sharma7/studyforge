"use client"; //for now but maybe use server here later and do a workaroud for context
import { ColorContext, MenuContext } from "@/lib/contexts";
import { useState } from "react";

export default function FilesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contextMenuKey, setContextMenuKey] = useState("");
  const color = localStorage.getItem("color")
    ? localStorage.getItem("color")
    : "slate";
  const [colorTheme, setColorTheme] = useState(color);

  return (
    <ColorContext.Provider value={{ colorTheme, setColorTheme }}>
      <MenuContext.Provider value={{ contextMenuKey, setContextMenuKey }}>
        <div data-theme={colorTheme}>{children}</div>
      </MenuContext.Provider>
    </ColorContext.Provider>
  );
}
