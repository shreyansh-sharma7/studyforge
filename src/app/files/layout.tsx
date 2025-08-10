"use client"; //for now but maybe use server here later and do a workaroud for context
import { MenuContext } from "@/lib/contexts";
import { useState } from "react";

export default function FilesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contextMenuKey, setContextMenuKey] = useState("");
  return (
    <MenuContext.Provider value={{ contextMenuKey, setContextMenuKey }}>
      {children}
    </MenuContext.Provider>
  );
}
