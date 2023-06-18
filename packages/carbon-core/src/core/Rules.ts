import { EventContext } from "./EventContext"
import { Node } from "./Node"

export type InputHandler = (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => void;

export interface ChangeRule {
  execute(ctx: EventContext<KeyboardEvent>, text: string,): boolean
  merge(rule: ChangeRule): ChangeRule
}

export class ChangeRules implements ChangeRule {
  rules: ChangeRule[]

  constructor(...rules: ChangeRule[]) {
    this.rules = rules
  }

  execute(ctx: EventContext<KeyboardEvent>, text: string,): boolean {
    return this.rules.some(r => r.execute(ctx, text))
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

  execute(ctx: EventContext<KeyboardEvent>, text: string,): boolean {
    console.info('[matching]', text, this.regex, this.regex.test(text));

    if (this.regex.test(text)) {
      this.handler(ctx, this.regex, text);
      return true
    }
    return false
  }

  merge(...rules: ChangeRule[]): ChangeRule {
    return new ChangeRules(this, ...rules);
  }
}

export class BeforeInputRuleHandler {
  constructor(readonly rules: InputRule[]) { }
  // process the event based on modified node.textContent
  process(ctx: EventContext<KeyboardEvent>, node: Node): boolean {
    const {event, app} = ctx;
    const { selection } = app;
    if (!selection.isCollapsed) return false;
    const { head } = selection;
    console.log('before input', node.id.toString(), node.textContent);
    
    let text = '';
    if (node.isEmpty) {
      text = (event as any).data;
    } else {
      const { textContent } = node;
      text = textContent.slice(0, head.offset) + (event as any).data + textContent.slice(head.offset);
    }

    console.log(`"${text}"`, node.id.toString(), node.textContent);
    const done = this.rules.some(rule => rule.execute(ctx, text))
    return done;
  }
}

export class AfterInputRuleHandler {
  constructor(readonly rules: InputRule[]) { }

  // process the event based on existing node.textContent
  process(ctx: EventContext<KeyboardEvent>, node: Node): boolean {
    const text = node.textContent;
    return this.rules.some(rule => rule.execute(ctx,  text))
  }
}

// used in afterInput
export class AfterInputRule extends InputRule {
  // match(event: EditorEvent) {}
}

export class PasteRule implements ChangeRule {
  regex: RegExp;

  handler: (event: EventContext<KeyboardEvent>) => void;

  constructor(regex: RegExp, handler: (event: EventContext<KeyboardEvent>) => void) {
    this.regex = regex;
    this.handler = handler;
  }

  execute(ctx: EventContext<KeyboardEvent>, text: string,): boolean {
    if (this.regex.test(text)) {
      this.handler(ctx);
      return true
    }
    return false
  }

  merge(rule: ChangeRule): ChangeRule {
    throw new Error('Method not implemented.');
  }
}
