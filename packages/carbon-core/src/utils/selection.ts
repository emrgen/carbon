import { Carbon } from "@emrgen/carbon-core";

export const getSelectionRect = (app: Carbon) => {
  const domSelection = app.selection.intoDomSelection(app.store);
  if (!domSelection) {
    return;
  }
};
