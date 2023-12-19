import { test } from "vitest";
import { Test } from "../src/index";


test("proxy", () => {
  const test = new Proxy(new Test(), {
    get(target: Test, p: string | symbol, receiver: any): any {
      console.log('get', p, receiver);

      if (p in target) {
        return Reflect.get(target, p, receiver)
      } else {
        // @ts-ignore
        return target.cmd[p];
      }
    },
  });

  test.print();
  // test.run();

});
