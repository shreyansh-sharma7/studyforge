import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NodeType } from "../../database.types";

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