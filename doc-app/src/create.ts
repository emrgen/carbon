import { EventsOut, Pin, PinnedSelection, State } from "@emrgen/carbon-core";
import { useCreateCarbon } from "@emrgen/carbon-react";
import { flattenDeep } from "lodash";
import { useEffect } from "react";

export const useCreate = (data, plugins) => {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins), (app) => {
    app.on(EventsOut.mounted, () => {
      const page = app.content.find((n) => n.name === "page");
      if (!page) return;
      const node = page.child(1);
      if (!node) return;

      const selection = PinnedSelection.fromPin(Pin.toStartOf(node)!)!;
      console.log(selection.toString());
      app.tr.Select(selection).Dispatch();
    });
  });

  useEffect(() => {
    const onUpdate = (state: State) => {
      console.info(state.content.child(0)?.size);
    };

    app.on("changed", onUpdate);
    return () => {
      app.off("changed", onUpdate);
    };
  }, [app]);

  return app;
};
