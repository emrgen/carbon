import {
	blockPresets,
	node,
	section,
	text,
	title
} from "@emrgen/carbon-blocks";

import {
  Actor,
  CarbonContext,
  CarbonContent,
  useCreateCarbon,
  CarbonChangeContext,
} from "@emrgen/carbon-core";

const data = node("doc", [
 	title([text("section 1")]),
	section([
		title([text("section 1")]),
		section([title([text("section 2")])]),
		section([title([text("section 3")])]),
	]),
	section([title([text("section 3")]),]),
]);

const actor = new Actor(1, 0)

export default function Test() {
	const app = useCreateCarbon(actor, data, [blockPresets])

	// console.log(app.content)

	return (
		<CarbonContext app={app}>
			<CarbonChangeContext>
				<CarbonContent />
			</CarbonChangeContext>
		</CarbonContext>
  );
}
