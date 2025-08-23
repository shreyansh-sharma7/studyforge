import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NodeType } from "../../database.types";
import { metadata } from "@/app/layout";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export  function resolveTemplate(template:any, node:NodeType){
  let nodeTemplated:{
    [key: string]: any;
  }= {}
for (const key in template) {
  if (Object.prototype.hasOwnProperty.call(template, key)) {
    const data = template[key];
   if(data.type=="path") {
    nodeTemplated[key]=node.path
   }else if (data.type=="date_created"){
      // Options for formatting the creation date
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
    
      // Format the node's creation date for display
      const creation_date = new Date(node.created_at).toLocaleString(
        "en-US",
        options
      );
    nodeTemplated[key]=creation_date
   }
   else{
    nodeTemplated[key]=node.metadata[key]
   }
  }
}
  return nodeTemplated
}

//needed so tailwind renders "dynamic prop colors"
export const colorClassMap = {
  slate: "bg-slate-700/50",
  gray: "bg-gray-700/50",
  zinc: "bg-zinc-700/50",
  neutral: "bg-neutral-700/50",
  stone: "bg-stone-700/50",
  red: "bg-red-700/50",
  orange: "bg-orange-700/50",
  amber: "bg-amber-700/50",
  yellow: "bg-yellow-700/50",
  lime: "bg-lime-700/50",
  green: "bg-green-700/50",
  emerald: "bg-emerald-700/50",
  teal: "bg-teal-700/50",
  cyan: "bg-cyan-700/50",
  sky: "bg-sky-700/50",
  blue: "bg-blue-700/50",
  indigo: "bg-indigo-700/50",
  violet: "bg-violet-700/50",
  purple: "bg-purple-700/50",
  fuchsia: "bg-fuchsia-700/50",
  pink: "bg-pink-700/50",
  rose: "bg-rose-700/50",
};
