import { CarbonText } from "@emrgen/carbon-react";

export const AtomicText = (props) => {
  return (
    <span>
      &thinsp;
      <CarbonText {...props} />
      &thinsp;
    </span>
  );
};
