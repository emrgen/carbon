// Things needed to change a node type (e.g. from paragraph to heading):
import { BeforePlugin } from "../core/index";
import { Pin } from "../core/index";
import { Carbon } from "../core/index";
import { TitleNode } from "../core/index";
import { PinnedSelection } from "../core/index";
import { StateActions } from "../core/index";
import { TxType } from "../core/index";

export class RewritePlugin extends BeforePlugin {
  name = "rewriter";

  inputRules: BeforeInputRewriteRuleHandler;

  constructor() {
    super();
    this.inputRules = new BeforeInputRewriteRuleHandler([
      new RewriteInputRule(/-->/g, this.changeText("-->", "XX")),
      new RewriteInputRule(/->/g, this.changeText("->", "→")),
      new RewriteInputRule(/=>$/g, this.changeText("=>", "⇒")),
    ]);
  }

  transaction(app: Carbon, tx: StateActions) {
    if (tx.type !== TxType.Undo) {
      this.checkInputRules(app);
    }
  }

  checkInputRules(app: Carbon) {
    const { selection } = app;
    // if (!selection.isCollapsed || selection.isIdentity) return;
    //
    // const { head } = selection;
    //
    // this.inputRules.execute(app, head);
  }

  changeText(from: string, to: string) {
    return (app: Carbon, pin: Pin, text: string) => {
      const tail = pin.moveBy(-from.length)!;
      const selection = PinnedSelection.create(tail, pin);
      app.cmd.transform.insertText(selection, to).dispatch();
    };
  }
}

class BeforeInputRewriteRuleHandler {
  constructor(readonly rules: RewriteInputRule[]) {}

  execute(app: Carbon, pin: Pin): boolean {
    const text = this.getText(pin);
    return this.rules.some((rule) => rule.execute(app, pin, text));
  }

  protected getText(head: Pin): string {
    const { node } = head;
    const [left] = TitleNode.from(node).split(head.steps);
    if (!left) return "";
    return left.textContent;
  }
}

type RewriteInputHandler = (app: Carbon, pin: Pin, text: string) => void;

class RewriteInputRule {
  constructor(
    readonly regex: RegExp,
    readonly handler: RewriteInputHandler,
  ) {}

  execute(app: Carbon, pin: Pin, text: string): boolean {
    if (this.regex.test(text)) {
      this.handler(app, pin, text);
      return true;
    }

    return false;
  }
}
