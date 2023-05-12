import {
	blockPresets,
	node,
	section,
	text,
	title
} from "@emrgen/carbon-blocks";

import {
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

export default function Test() {
	const app = useCreateCarbon( data, [blockPresets])

	// console.log(app.content)

	return (
		<CarbonContext app={app}>
			<CarbonChangeContext>
				<CarbonContent />
			</CarbonChangeContext>
		</CarbonContext>
  );
}
