export const DefinitionFactory = {
  Literal(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const { value } = body;
    return () => value;
  },
  BlockStatement(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start + 1, body.end - 1);
    // no need to return the block statement as the return is within the block body
    return this.define(name, deps, `${blockBody}`, ast);
  },
  Identifier(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `return ${ast.body.name}`, ast);
  },
  ImportDeclaration(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start, body.end);
    console.log("ImportDeclaration", body, blockBody);
    // ImportDeclaration is not an expression, so we don't return it
    // return this.define(name, deps, `${blockBody}`, ast);
  },
  YieldExpression(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `${code}`, ast);
  },
  ClassExpression(name: string, deps: string[], ast: any, code: string) {
    return this.define(name, deps, `return (${code})`, ast);
  },
  CallExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const fnBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${fnBody})`);
  },
  ArrowFunctionExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  FunctionExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  BinaryExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  TaggedTemplateExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  NewExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  MemberExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  ChainExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  ArrayExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  TemplateLiteral(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  ConditionalExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  LogicalExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  UnaryExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  UpdateExpression(name: string, deps: string[], ast: any, code: string) {
    return this.Expression(name, deps, ast, code);
  },
  AwaitExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${blockBody})`, ast);
  },
  ImportExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start, body.end);
    console.log("ImportExpression", body, blockBody);
    return this.define(name, deps, `return (${blockBody})`, ast);
  },
  Expression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const blockBody = code.slice(body.start, body.end);
    return this.define(name, deps, `return (${blockBody})`, ast);
  },

  SequenceExpression(name: string, deps: string[], ast: any, code: string) {
    const { body } = ast;
    const { expressions } = body;
    const endNode = expressions[expressions.length - 1];
    const blockBody = code.slice(endNode.start, endNode.end);
    return this.define(name, deps, `return (${blockBody})`, ast);
  },

  // create a function definition combining the name, inputs and body
  define(name: string, inputs: string[], body: string, opts?: any) {
    // console.log(opts)
    const fnStr = `return ${opts?.async ? "async" : ""} function ${opts?.generator ? "*" : ""} ${!!name ? `_${name}` : ""} ( ${inputs.join(", ")} ) {\n  ${body} \n} `;
    console.log("factory defined =>", fnStr, opts);
    return new Function(fnStr)();
  },
}
