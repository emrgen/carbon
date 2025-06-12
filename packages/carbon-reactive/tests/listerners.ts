import { Runtime } from "../src/index";
import { Variable } from "../src/Variable";

export function registerListeners(runtime: Runtime) {
  runtime
    .on("fulfilled", (v: Variable) => {
      console.log("fulfilled:", v.id, "=>", v.value, v.version);
    })
    .on("rejected", (v: Variable) => {
      console.log("rejected:", v.id, "=>", v.error?.toString(), v.version);
    })
    .on("pending", (v: Variable) => {
      console.log("pending:", v.id, v.cell.name);
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
