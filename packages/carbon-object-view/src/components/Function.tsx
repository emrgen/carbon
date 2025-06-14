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
  let formattedArgs = args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)));
  result.push(...formattedArgs);

  return result.join(" ");
}

export const FunctionView = ({ data, propName, isIndex, isGenerator = false, isAsync = false, root = false }) => {
  const keyClass = isIndex ? "cov-array-key" : "cov-object-key";

  return (
    <div className={"cov-function"}>
      {!root && propName && <span className={keyClass}>{propName}: </span>}
      {root && propName && <span className={keyClass} id={root ? "cov-root-name":''}>{propName} =&nbsp;</span>}
      <span className={"cov-function-key"}>{isAsync ? "async " : ""}f{isGenerator ? "*" : ""}</span>
      <span className={"cov-function-arguments"}>({getParamNames(data)})</span>
    </div>
  );
};

const STRIP_COMMENTS = /\/\/.*$|\/\*[\s\S]*?\*\//mg;

function getParamNames(fn) {
  const fnStr = fn.toString().replace(STRIP_COMMENTS, ''); // remove comments
  const args = fnStr
      .match(/^(?:async\s*)?(?:function)?\s*[^\(]*\(\s*([^\)]*)\)/) ||
    fnStr.match(/^\(?\s*([^\)=>]*)\)?\s*=>/); // arrow function

  if (!args || !args[1]) return [];

  return args[1]
}
