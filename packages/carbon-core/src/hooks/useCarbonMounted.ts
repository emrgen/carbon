import {EventsOut, useCarbon} from "@emrgen/carbon-core";
import {useEffect} from "react";

export const useCarbonMounted = (fn: Function) => {
  const app = useCarbon()
  useEffect(() => {
    const onMounted = () => {
      fn()
    }

    app.on(EventsOut.mounted, onMounted)
    return () => {
      app.off(EventsOut.mounted, onMounted)
    }
  },[app, fn])
}
