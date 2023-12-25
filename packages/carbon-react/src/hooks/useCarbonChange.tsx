import { useCarbon } from "./useCarbon";
import {
  createContext, useContext, useEffect
} from "react";
import {ChangeManager} from "@emrgen/carbon-core";

const InternalCarbonChangeContext = createContext<ChangeManager>(null!);

export const useCarbonChange = () => useContext(InternalCarbonChangeContext);

export const CarbonChangeContext = (props) => {
  const app = useCarbon();

  return (
    <InternalCarbonChangeContext.Provider value={app.change}>
      {props.children}
    </InternalCarbonChangeContext.Provider>
  );
};
