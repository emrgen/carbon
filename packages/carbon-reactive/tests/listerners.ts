import { Runtime } from "../src/index";

export function registerListeners(runtime: Runtime) {
  runtime
    .on("fulfilled", (v) => {
      console.log("fulfilled:", v.id, "=>", v.value);
    })
    .on("rejected", (v) => {
      console.log("rejected:", v.id, "=>", v.error?.toString());
    });
}
