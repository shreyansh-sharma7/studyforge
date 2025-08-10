import { MenuContext } from "@/lib/contexts";
import { useContext } from "react";

export const ContextMenu = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const menuContext = useContext(MenuContext);
  const contextType = menuContext.contextMenuKey.split("_")[0];

  return (
    <div>
      {/*node context type */}
      {contextType === "node" && (
        <div
          className="absolute top-8 right-2 z-50 w-32 bg-neutral-800 rounded shadow-md text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}

      {/* prop context type */}
      {contextType == "prop" && <div className="">{children}</div>}
    </div>
  );
};
