import { SuspensePage } from "@/components/SuspensePage.tsx";
import { lazy } from "react";

const LoginPreview = lazy(() => {
  return import("./index.tsx").then((module) => {
    return { default: module.Login } as { default: typeof module.Login };
  });
});

export const LazyLogin = () => {
  return (
    <SuspensePage>
      <LoginPreview />
    </SuspensePage>
  );
};
