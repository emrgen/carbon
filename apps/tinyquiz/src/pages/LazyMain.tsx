import { lazy } from "react";
import { SuspensePage } from "@/components/SuspensePage.tsx";

export const MainPreview = lazy(() => {
  return import("./index.tsx").then((module) => {
    return { default: module.Main };
  });
});

export const LazyMain = () => {
  return (
    <SuspensePage>
      <MainPreview />
    </SuspensePage>
  );
};
