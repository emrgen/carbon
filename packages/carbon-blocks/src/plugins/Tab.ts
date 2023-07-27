import { CarbonPlugin, EventHandler, NodeSpec, preventAndStopCtx } from "@emrgen/carbon-core";

export class Tab extends CarbonPlugin {

  name = 'tab';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'tabTitles tabContent*',
      isolating: true,
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new TabContent(),
      new TabTitles(),
      new TabTitle(),
    ]
  }
}


export class TabContent extends CarbonPlugin {

  name = 'tabContent';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'content*',
      isolating: true,
      selectable: true,
      collapsible: true,

      attrs: {
        html: {
          contentEditable: true,
          suppressContentEditableWarning: true,
        }
      }
    }
  }
}


export class TabTitles extends CarbonPlugin {

  name = 'tabTitles';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'tabTitle*',
    }
  }
}


export class TabTitle extends CarbonPlugin {

  name = 'tabTitle';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'section*',
      isolating: true,
      selectable: true,

      attrs: {
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx) => {
        preventAndStopCtx(ctx);
      }
    }
  }
}



