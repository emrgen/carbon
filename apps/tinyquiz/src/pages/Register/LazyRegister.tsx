import {lazy} from "react";
import {SuspensePage} from "@/components/SuspensePage.tsx";

const LoginPreview = lazy(() => {
  return import("./index.tsx").then((module) => ({default: module.Register}) as { default: typeof module.Register })
});


export const LazyRegister = () => {
  return (
    <SuspensePage>
      <LoginPreview/>
    </SuspensePage>
  )
}