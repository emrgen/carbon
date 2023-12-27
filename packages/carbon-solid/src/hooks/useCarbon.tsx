import {createContext, useContext} from "solid-js";
import {Carbon} from "@emrgen/carbon-core";

const InnerCarbonContext = createContext<Carbon>({} as Carbon);

export const CarbonContext = (props: {value: Carbon, children: any}) => {
  return (
    <InnerCarbonContext.Provider value={props.value}>
      {props.children}
    </InnerCarbonContext.Provider>
  )
}

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
}
