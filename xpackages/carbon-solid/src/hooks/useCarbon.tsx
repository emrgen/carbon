import {CarbonEditor} from "@emrgen/carbon-core";
import {createContext, onMount, useContext} from "solid-js";
import {CarbonEvents} from "../components/index";

const InnerCarbonContext = createContext<CarbonEditor>({} as CarbonEditor);

export const CarbonContext = (props: { value: CarbonEditor; children: any }) => {
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
