// test("test literal variable computation", async (t) => {
//   const runtime = new Runtime({
//     a: 1,
//   });
//   registerListeners(runtime);
//
//   const m = runtime.mod;
//
//   m.define(Cell.from("x", "x", ["a"], (a) => a + 1));
//   m.define(Cell.from("y", "y", ["a", "x"], (a, x) => a + x));
//
//   m.redefine(Cell.from("x", "x", ["a"], (a) => a + 2));
//
//   m.redefine(Cell.from("x", "x", ["y"], (a) => a + 2));
// });

// test("test calculation with deps", async (t) => {
//   const runtime = new Runtime({});
//   registerListeners(runtime);
//
//   const m = runtime.mod;
//
//   m.define(Cell.from("x", "x", ["a"], async (a) => await Promises.delay(10, 3 * a)));
//   m.define(Cell.from("y", "y", ["a", "x"], (a, x) => a + x));
//
//   m.redefine(Cell.from("a", "a", [], () => 2));
//
//   await Promises.delay(100);
// });

// test("test calculation with promises auto resolve", async (t) => {
//   const runtime = new Runtime({});
//   registerListeners(runtime);
//
//   const m = runtime.mod;
//
//   m.define(Cell.from("x", "x", ["a"], async (a) => await Promises.delay(1000, 3 * a)));
//   m.redefine(Cell.from("a", "a", [], () => 2));
//
//   await Promises.delay(2000);
// });

// test("test calculation with generator", async (t) => {
//   const runtime = new Runtime({});
//   registerListeners(runtime);
//
//   const m = runtime.mod;
//
//   const x = m.define(
//     Cell.from("x", "x", [], function* () {
//       let i = 0;
//       while (true) {
//         yield Promises.delay(10, i++);
//         if (i > 10) break;
//       }
//     }),
//   );
//
//   await Promises.delay(1000);
//   // console.log(x.id, x.value);
//   expect(x.value).toBe(10);
// });
