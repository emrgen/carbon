import { test } from "vitest";

class Test {
  cmd = {
    print: () => {
      console.log("print");
    },
  };

  print() {
    this.cmd.print();
  }
}

test("proxy", () => {
  const test = new Proxy(new Test(), {
    get(target: Test, p: string | symbol, receiver: any): any {
      console.log('get', p, receiver);
    },
    apply(target: Test, thisArg: any, argArray: any[]): any {
      console.log('apply', argArray);
      // return target[p](...argArray);
    }
  });
  // test.print();

});
