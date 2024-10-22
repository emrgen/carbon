import {lazy} from "react";
import {SuspensePage} from "@/components/SuspensePage.tsx";

const LandingPreview = lazy(() => {
  return import("./index.tsx").then((module) => ({default: module.Landing}) as { default: typeof module.Landing })
});


export const LazyLanding = () => {
  return (
    <SuspensePage>
      <LandingPreview/>
    </SuspensePage>
  )
}