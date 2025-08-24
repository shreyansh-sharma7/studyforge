import { createContext } from "react";

export const MenuContext = createContext({contextMenuKey:"",setContextMenuKey:(p0: string)=>{}})
export const ColorContext = createContext({colorTheme:"slate",setColorTheme:(p0:string)=>{}})