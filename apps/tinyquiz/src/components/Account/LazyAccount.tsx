import {lazy} from "react";
import {SuspensePage} from "@/components/SuspensePage.tsx";

const AccountPreview = lazy(() => {
  return import("./index.tsx").then((module) => ({default: module.Account}) as { default: typeof module.Account })
});


export const LazyAccount = () => {
  return (
    <SuspensePage>
      <AccountPreview/>
    </SuspensePage>
  )
}