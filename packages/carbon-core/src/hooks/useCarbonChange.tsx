import { ChangeManager } from "../core/ChangeManager";
import { useCarbon } from "./useCarbon";
import {
  createContext, useContext, useEffect
} from "react";

const InternalCarbonChangeContext = createContext<ChangeManager>(null!);

export const useCarbonChange = () => useContext(InternalCarbonChangeContext);

export const CarbonChangeContext = (props) => {
  const app = useCarbon();

  useEffect(() => {
    console.log('app x', app);
  },[app])

  
  return (
    <InternalCarbonChangeContext.Provider value={app.change}>
      {props.children}
    </InternalCarbonChangeContext.Provider>
  );
};
