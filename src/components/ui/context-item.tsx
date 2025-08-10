import { MenuContext } from "@/lib/contexts";
import { useContext } from "react";

export const ContextItem = ({
  title,
  onclick,
}: {
  title: string;
  onclick: (e?: React.MouseEvent) => void;
}) => {
  const menuContext = useContext(MenuContext);
  const contextType = menuContext.contextMenuKey.split("_")[0];

  return (
    <div className="">
      {contextType == "node" && (
        <button
          className="block w-full text-left px-3 py-2 hover:bg-neutral-700"
          onClick={onclick}
        >
          {title}
        </button>
      )}
      {contextType == "prop" && (
        <button
          className="block w-full text-left px-3 py-2 text-xs hover:bg-zinc-500 rounded"
          onClick={onclick}
        >
          <span className="bg-cyan-700 p-1 rounded font-bold">{title}</span>
        </button>
      )}

      {contextType == "createprop" && (
        <button
          className="block w-full text-left px-3 py-2 text-xs hover:bg-zinc-500 rounded"
          onClick={onclick}
        >
          <span className=" p-1 rounded">{title}</span>
        </button>
      )}
    </div>
  );
};
