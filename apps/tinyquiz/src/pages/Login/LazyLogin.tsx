import {lazy} from "react";
import {SuspensePage} from "@/components/SuspensePage.tsx";

const LoginPreview = lazy(() => {
  return import("./index.tsx").then((module) => ({default: module.Login}) as { default: typeof module.Login })
});


export const LazyLogin = () => {
  return (
    <SuspensePage>
      <LoginPreview/>
    </SuspensePage>
  )
}