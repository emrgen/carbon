import {
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";

import {
  CarbonContext,
  CarbonContent,
  useCreateCarbon,
  CarbonChangeContext,
  extensionPresets,
} from "@emrgen/carbon-core";

const data = node("document", [
  title([text("Carbon "), text("document"), text(" title")]),
  section([title([])]),
  section([title([text("sect"), text("ABC"), text("ion 1")])]),
  section([
    title([text("section 1")]),
    section([title([text("section 1.1")])]),
    section([title([text("section 1.2")])]),
  ]),
  node('divider'),
  section([
    title([text("section 2")]),
    section([
      title([text("section 2.1")]),
      section([title([text("section 2.1.1")])]),
      section([
        title([text("section 2.1.2")]),
        section([title([text("section 2.1.2.1")])]),
        section([title([text("section 2.1.2.2")])]),
      ]),
    ]),
  ]),
  section([title([text("section 3")])]),
  node("h1", [title([text("section 3")])]),
  node("h2", [title([text("section 3")])]),
  node("h3", [title([text("section 3")])]),
  node("h4", [title([text("section 3")])]),
  section([title([text("section 3")])]),
]);


export default function Dev() {
  const app = useCreateCarbon(data, [extensionPresets, blockPresets]);

  // @ts-ignore
  window.app = app
  // console.log(app.content)

  return (
    <CarbonContext app={app}>
      <CarbonChangeContext>
        <CarbonContent />
      </CarbonChangeContext>
    </CarbonContext>
  );
}
