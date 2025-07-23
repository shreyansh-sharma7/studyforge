import React from "react";

type Breadcrumb = { name: string; path: string };

export interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

function getBreadcrumbs(path: string): Breadcrumb[] {
  const cleanPath = path && path !== "/" ? path.replace(/^\/|\/$/g, "") : "";
  if (!cleanPath) return [{ name: "[ROOT]", path: "/" }];
  const parts = cleanPath.split("/");
  const breadcrumbs: Breadcrumb[] = [{ name: "[ROOT]", path: "/" }];
  for (let i = 0; i < parts.length; i++) {
    breadcrumbs.push({
      name: parts[i],
      path: "/" + parts.slice(0, i + 1).join("/"),
    });
  }
  return breadcrumbs;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  const crumbs = getBreadcrumbs(path);

  return (
    <nav
      className="flex items-center gap-2 mb-4 unselectable"
      aria-label="Breadcrumb"
    >
      <div className="flex items-center bg-neutral-800 rounded-md">
        {crumbs.map((crumb, idx) => (
          <span key={crumb.path} className=" flex items-center">
            <button
              className={`cursor-pointer text-2xl px-2 py-1 focus:outline-none saira-regular
              ${
                idx === crumbs.length - 1
                  ? "font-bold text-primary-400 cursor-default bg-"
                  : "text-gray-300 hover:underline transition-colors"
              }
            `}
              disabled={idx === crumbs.length - 1}
              onClick={() => onNavigate(crumb.path)}
              type="button"
              aria-current={idx === crumbs.length - 1 ? "page" : undefined}
            >
              {crumb.name}
            </button>
            {/* slash creator */}
            {idx < crumbs.length - 1 && (
              <span className="text-gray-400 select-none text-3xl -translate-y-0.5">
                /
              </span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
