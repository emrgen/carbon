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

export function watch(runtime: Runtime, id: string) {
  runtime
    .on("fulfilled:" + id, (v) => {
      console.log("fulfilled:", v.id, "=>", v.value);
    })
    .on("rejected:" + id, (v) => {
      console.log("rejected:", v.id, "=>", v.error?.toString());
    });
}

export function collect(runtime: Runtime, id: string) {
  const values = {
    _values: [] as any[],
    get value() {
      return this._values;
    },
  };
  runtime.on("fulfilled:" + id, (v) => {
    values._values.push(v.value);
  });

  return values;
}
