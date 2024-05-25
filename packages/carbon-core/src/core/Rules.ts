import { EventContext } from "./EventContext";
import { Node } from "./Node";
import { Pin } from "@emrgen/carbon-core";

export type InputHandler = (
  ctx: EventContext<KeyboardEvent>,
  regex: RegExp,
  text: string,
) => void;

export interface ChangeRule {
  execute(ctx: EventContext<KeyboardEvent>, text: string): boolean;

  merge(rule: ChangeRule): ChangeRule;
}

export class ChangeRules implements ChangeRule {
  rules: ChangeRule[];

  constructor(...rules: ChangeRule[]) {
    this.rules = rules;
  }

  execute(ctx: EventContext<KeyboardEvent>, text: string): boolean {
    return this.rules.some((r) => r.execute(ctx, text));
  }

  merge(...rules: ChangeRule[]): ChangeRule {
    return new ChangeRules(this, ...rules);
  }
}

export class InputRule implements ChangeRule {
  regex: RegExp;

  handler: InputHandler;

  constructor(regex: RegExp, handler: InputHandler) {
    this.regex = regex;
    this.handler = handler;
  }

  execute(ctx: EventContext<KeyboardEvent>, text: string): boolean {
    // console.info('[matching]', text, this.regex, this.regex.test(text));

    if (this.regex.test(text)) {
      this.handler(ctx, this.regex, text);
      return true;
    }
    return false;
  }

  merge(...rules: ChangeRule[]): ChangeRule {
    return new ChangeRules(this, ...rules);
  }
}

export class BeforeInputRuleHandler {
  constructor(readonly rules: InputRule[]) {}

  // process the event based on modified node.textContent
  execute(ctx: EventContext<KeyboardEvent>, node: Node): boolean {
    const { event, app } = ctx;
    // @ts-ignore
    const { data, key } = event.nativeEvent;
    const insertText = (event as any).data ?? data ?? key;

    // console.log('insertText', insertText, key)

    const { selection } = app;
    if (!selection.isCollapsed) return false;
    const { head } = selection;
    const text = this.getText(head, node, insertText);
    // console.log('before input', node.id.toString(), node.textContent);

    // console.log(`"${text}"`, node.id.toString(), node.textContent);
    const done = this.rules.some((rule) => rule.execute(ctx, text));
    return done;
  }

  protected getText(head: Pin, node: Node, insertText: string) {
    if (node.isEmpty) {
      return insertText;
    } else {
      const { textContent } = node;
      return (
        textContent.slice(0, head.offset) +
        insertText +
        textContent.slice(head.offset)
      );
    }
  }
}

export class BeforeInputRuleInlineHandler extends BeforeInputRuleHandler {
  override getText(head: Pin, _node: Node, insertText: string) {
    const down = head.down();
    const { node } = down;
    if (node.isText) {
      return (
        node.textContent.slice(0, head.offset) +
        insertText +
        node.textContent.slice(head.offset)
      );
    } else {
      return insertText;
    }
  }
}

export class AfterInputRuleHandler {
  constructor(readonly rules: InputRule[]) {}

  // process the event based on existing node.textContent
  execute(ctx: EventContext<KeyboardEvent>, node: Node): boolean {
    const text = node.textContent;
    return this.rules.some((rule) => rule.execute(ctx, text));
  }
}

// used in afterInput
export class AfterInputRule extends InputRule {
  // match(event: EditorEvent) {}
}

export class PasteRule implements ChangeRule {
  regex: RegExp;

  handler: (event: EventContext<KeyboardEvent>) => void;

  constructor(
    regex: RegExp,
    handler: (event: EventContext<KeyboardEvent>) => void,
  ) {
    this.regex = regex;
    this.handler = handler;
  }

  execute(ctx: EventContext<KeyboardEvent>, text: string): boolean {
    if (this.regex.test(text)) {
      this.handler(ctx);
      return true;
    }
    return false;
  }

  merge(rule: ChangeRule): ChangeRule {
    throw new Error("Method not implemented.");
  }
}
