import "./question.styl";
import { Question } from "./plugins/Question";
import { Extension } from "@emrgen/carbon-react";
import { ReactRenderer } from "@emrgen/carbon-react";
import { QuestionComp } from "./renderers/Question";
import { HintsComp } from "./renderers/Hints";
import { ExplanationsComp } from "./renderers/Explanations";
import { MultipleChoiceQuestionComp } from "./renderers/MultipleChoice";
import { MultipleChoiceOptionComp } from "./renderers/MultipleChoice";

export const questionExtension: Extension = {
  plugins: [new Question()],
  renderers: [
    ReactRenderer.create("question", QuestionComp),
    ReactRenderer.create("hints", HintsComp),
    ReactRenderer.create("explanations", ExplanationsComp),

    ReactRenderer.create("mcq", MultipleChoiceQuestionComp),
    ReactRenderer.create("mcqOption", MultipleChoiceOptionComp),

    // ReactRenderer.create("questionTitle", QuestionTitleComp),
    // ReactRenderer.create("questionDescription", QuestionDescriptionComp),
  ],
};

export * from './observable/Questions';
