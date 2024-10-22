import { useSidebarStore } from "@/pages/store.ts";
import { keys } from "lodash";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

// map Routes to keys
export const Routes = {
  "/": "home",
  "/quiz": "quiz",
  "/question": "question",
  "/account": "account",
};

export function useSidebarActiveKey() {
  const location = useLocation();
  const setActiveKey = useSidebarStore((state) => state.setActiveKey);

  const activeKey = useMemo(() => {
    const { pathname } = location ?? { pathname: "/" };
    return (
      keys(Routes)
        .sort((a, b) => b.length - a.length)
        .find((route) => pathname.startsWith(route)) ?? "/"
    );
  }, [ location ]);

  useEffect(() => {
    setActiveKey(activeKey);
  }, [ activeKey ]);

  return activeKey;
}
