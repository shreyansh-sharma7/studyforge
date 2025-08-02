import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NodeType } from "../../database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export  function resolveTemplate(template:any, node:NodeType){
for (const key in template) {
  if (Object.prototype.hasOwnProperty.call(template, key)) {
    const element = template[key];
   if(element=="$path") {
    return node.path
   }
  }
}
}