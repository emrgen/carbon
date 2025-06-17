import {CarbonEditor} from "@emrgen/carbon-core";

export const getSelectionRect = (app: CarbonEditor) => {
  const domSelection = app.selection.intoDomSelection(app.store);
  if (!domSelection) {
    return;
  }
};
