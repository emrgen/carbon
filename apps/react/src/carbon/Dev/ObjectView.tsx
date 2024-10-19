import { ObjectViewer } from "@emrgen/carbon-object-view";

export const ObjectView = () => {
  return (
    <div className={"carbon-object-viewer"}>
      <ObjectViewer data={{ Name: "subhasis" }} />
    </div>
  );
};
