function serializeConsoleLog(...args) {
  let result: any[] = [];

  // Format if first argument is a string
  if (typeof args[0] === "string") {
    let formattedMessage = args.shift().replace(/%[csdifoO]/g, (match) => {
      // Keep raw token if no substitution args left
      if (args.length === 0) return match;

      switch (match) {
        // Formatting (omitted)
        case "%c":
          args.shift();
          return "";

        // String
        case "%s":
          return String(args.shift());

        // Integer
        case "%d":
        case "%i":
          return parseInt(args.shift());

        // Float
        case "%f":
          return parseFloat(args.shift());

        // Object
        case "%o":
        case "%O":
          return JSON.stringify(args.shift());
      }

      // Keep raw token if not replaced
      return match;
    });

    if (formattedMessage.length > 0) {
      result.push(formattedMessage);
    }
  }

  // Serialize remaining arguments
  let formattedArgs = args.map((arg) =>
    typeof arg === "string" ? arg : JSON.stringify(arg),
  );
  result.push(...formattedArgs);

  return result.join(" ");
}

export const FunctionView = ({ data }) => {
  return (
    <div className={"cov-function"}>
      <span className={"cov-function-key"}>f</span>
      <span className={"cov-function-arguments"}>({getParamNames(data)})</span>
    </div>
  );
};

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func) {
  const fnStr = func.toString().replace(STRIP_COMMENTS, "");
  let result = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);
  if (result === null) result = [];
  return result.join(", ");
}
