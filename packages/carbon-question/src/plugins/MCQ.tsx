import {CarbonEditor, CarbonPlugin, CheckedPath, EventHandlerMap, Node} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  export interface Service {
    mcq: {
      isAttempted(node: Node): boolean;
      summary(node: Node): {};
    };
    mcqOption: {
      isSelected(node: Node): boolean;
      summary(node: Node): {};
    };
  }
}

interface MCQSummary {
  options: [];
  correct: [];
  marks: number;
  attempts: number;
}

export class MCQ extends CarbonPlugin {
  name = "mcq";

  spec() {
    return {
      group: "questionType",
      content: "mcqOption+",
      inlineSelectable: true,
      blockSelectable: true,
      isolate: true,
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
          placeholder: {
            empty: "Question Title",
            focused: "Question Title",
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new MultipleChoiceOption()];
  }
  services(): Record<string, Function> {
    return {
      isAttempted(app: CarbonEditor, node: Node) {
        const options = node.children.filter((n) => n.name === "mcqOption");
        return options.some((option) =>
          app.service.mcqOption.isSelected(option),
        );
      },
      summary(app: CarbonEditor, node: Node) {
        const summaries = node.children
          .filter((n) => n.name === "mcqOption")
          .map((n) => app.service.mcqOption.summary(n) as MCQOptionSummary);

        return {
          options: node.children.map((n) => app.service.mcqOption.summary(n)),
          correct: summaries.every((s) => s.correct),
          marks: 1,
          attempts: 1,
        };
      },
    };
  }
}

interface MCQOptionSummary {
  correct: boolean;
}

export class MultipleChoiceOption extends CarbonPlugin {
  name = "mcqOption";

  spec() {
    return {
      group: "questionContent",
      content: "title",
      inlineSelectable: true,
      blockSelectable: true,
      splits: true,
      splitName: "mcqOption",
      depends: {
        prev: true,
        next: true,
      },
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
          placeholder: {
            empty: "",
            focused: "",
          },
        },
      },
    };
  }

  services(): Record<string, Function> {
    return {
      isSelected(app: CarbonEditor, node: Node) {
        return node.props.get(CheckedPath, false);
      },
      summary(app: CarbonEditor, node: Node) {
        return {
          correct: node.props.get(CheckedPath, false),
        };
      },
    };
  }

  keydown(): EventHandlerMap {
    return {};
  }
}
