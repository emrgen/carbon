import { test } from "vitest";

test("create carbon editor", () => {
  // const app = createCarbon();
  const template = carbon`
    carbon(id: "carbon")
      document
        title
        paragraph
          title
            | i am a text
  `;

  console.log(template);
});

const carbon = (...args: any[]) => {
  const template = args[0];
  const params = args.slice(1);

  const lines = template
    .join("")
    .split("\n")
    .filter((l: string) => l.trim().length > 0)
    .map((l: string) => l.replace(/^[\\n]+/, ""));

  const minSpace = lines.reduce((acc: number, line: string) => {
    const space = line.match(/^ */);
    return space && space[0].length < acc ? space[0].length : acc;
  }, 100);

  const trimmed = lines.map((l: string | any[]) => l.slice(minSpace));

  const createNode = (name: string, children: any[]) => {
    return {
      name,
      children,
    };
  };

  console.log(trimmed);

  return createNode("carbon", []);
};
