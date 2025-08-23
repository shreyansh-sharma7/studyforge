import { MenuContext } from "@/lib/contexts";
import { colorClassMap } from "@/lib/utils";
import { useContext, useState } from "react";

export const ContextItem = ({
  title,
  onclick,
  type,
  color,
}: {
  title: string;
  onclick: (...args: any[]) => void;
  type?: "input";
  color?: string;
}) => {
  const menuContext = useContext(MenuContext);
  const contextType = !type ? menuContext.contextMenuKey.split("_")[0] : type;
  const [inputValue, setInputValue] = useState("");

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
          <span
            className={`${
              colorClassMap[color! as keyof typeof colorClassMap]
            } p-1 rounded font-bold`}
          >
            {title}
          </span>
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

      {contextType == "input" && (
        <div className="block w-full text-left pl-3 py-0 text-xs hover:bg-zinc-500 rounded text-gray-500 hover:text-white hover:placeholder:text-gray-100">
          <input
            className="py-2 rounded font-bold outline-0 focus:text-white hover:placeholder:text-gray-300 w-full"
            placeholder={title}
            autoFocus={true} //why not work.
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyUp={(e) => {
              e.stopPropagation();
              if (e.key == "Enter") {
                //add the property to the template
                onclick(inputValue);
                setInputValue("");
              }
            }}
          ></input>
        </div>
      )}
    </div>
  );
};
