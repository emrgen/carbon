import { Carbon } from "@emrgen/carbon-core";
import { createContext, onMount, useContext } from "solid-js";
import { CarbonEvents } from "../components/index";

const InnerCarbonContext = createContext<Carbon>({} as Carbon);

export const CarbonContext = (props: { value: Carbon; children: any }) => {
  onMount(() => {
    props.value.mounted();
  });

  return (
    <InnerCarbonContext.Provider value={props.value}>
      <div class={"carbon-app"}>
        <CarbonEvents>{props.children}</CarbonEvents>
      </div>
    </InnerCarbonContext.Provider>
  );
};

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
};
