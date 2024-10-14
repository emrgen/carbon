// Things needed to change a node type (e.g. from paragraph to heading):
import { BeforePlugin, Node } from "../core/index";
import { EventContext } from "../core/index";
import { Pin } from "../core/index";
import { Carbon } from "../core/index";
import { TitleNode } from "../core/index";

export class RewritePlugin extends BeforePlugin {
  name = "changeName";

  inputRules: BeforeInputRewriteRuleHandler;

  constructor() {
    super();
    this.inputRules = new BeforeInputRewriteRuleHandler([]);
  }

  // handlers(): Partial<EventHandler> {
  //   return {
  //     beforeInput: (ctx: EventContext<KeyboardEvent>) => {
  //       this.checkInputRules(ctx);
  //     },
  //   };
  // }

  transaction(app: Carbon) {
    this.checkInputRules(app);
  }

  checkInputRules(app: Carbon) {
    const { selection } = app;
    if (!selection.isCollapsed) return;

    const { head } = selection;

    this.inputRules.execute(app, head);
  }

  // change -> to ⥟
  changeText(ctx: EventContext<KeyboardEvent>, block: Node, from: string) {}
}

class BeforeInputRewriteRuleHandler {
  constructor(readonly rules: RewriteInputRule[]) {}

  execute(app: Carbon, pin: Pin): boolean {
    const text = this.getText(pin);
    console.log("-------------------------- text", text);
    return this.rules.some((rule) => rule.execute(app, text));
  }

  protected getText(head: Pin): string {
    const { node } = head;
    const [left] = TitleNode.from(node).split(head.steps);
    if (!left) return "";
    return left.textContent;
  }
}

type RewriteInputHandler = (app: Carbon, regex: RegExp, text: string) => void;

class RewriteInputRule {
  constructor(
    readonly regex: RegExp,
    readonly handler: RewriteInputHandler,
  ) {}

  execute(app: Carbon, text: string): boolean {
    if (this.regex.test(text)) {
      this.handler(app, this.regex, text);
      return true;
    }

    return false;
  }
}
