import { CarbonPlugin } from "@emrgen/carbon-core";

export class Design extends CarbonPlugin {
  name = "deBoard";

  plugins(): CarbonPlugin[] {
    return [new DesignShape()];
  }
}

export class DesignShape extends CarbonPlugin {
  name = "deShape";
}