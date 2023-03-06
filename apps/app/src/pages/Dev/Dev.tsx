import {
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";

import {
  Actor,
  CarbonContext,
  CarbonContent,
  useCreateCarbon,
  CarbonChangeContext,
  extensionPresets,
} from "@emrgen/carbon-core";

const data = node("document", [
  title([text("Document Title")]),
  section([
    title([text("sect"), text("ion 1")]),
    section([title([text("section 2")])]),
    section([title([text("section 3")])]),
  ]),
  section([title([text("section 3")])]),
]);

const actor = new Actor(1, 0);

export default function Dev() {
  const app = useCreateCarbon(actor, data, [extensionPresets, blockPresets]);

  console.log(app.content)

  return (
    <CarbonContext app={app}>
      <CarbonChangeContext>
        <CarbonContent />
      </CarbonChangeContext>
    </CarbonContext>
  );
}
