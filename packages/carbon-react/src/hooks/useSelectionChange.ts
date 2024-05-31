import { useEffect } from "react";
import { useCarbon } from "./useCarbon";
import { EventsIn } from "@emrgen/carbon-core";

export const useSelectionChange = () => {
  const app = useCarbon();

  useEffect(() => {
    const onSelectionChange = (event: Event) => {
      app.onEvent(EventsIn.selectionchange, event);
    };

    const onSelectionStart = (event: Event) => {
      app.onEvent(EventsIn.selectstart, event);
    };

    document.addEventListener(EventsIn.selectionchange, onSelectionChange);
    document.addEventListener(EventsIn.selectstart, onSelectionStart);
    return () => {
      document.removeEventListener(EventsIn.selectionchange, onSelectionChange);
      document.removeEventListener(EventsIn.selectstart, onSelectionStart);
    };
  }, [app]);
};
