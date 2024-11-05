import "./question.styl";
import { Extension, ReactRenderer } from "@emrgen/carbon-react";
import { Question } from "./plugins/Question";
import { ExplanationsComp } from "./renderers/Explanations";
import { HintsComp } from "./renderers/Hints";
import {
  MultipleChoiceOptionComp,
  MultipleChoiceQuestionComp,
} from "./renderers/MultipleChoice";
import { QuestionComp } from "./renderers/Question";

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

export * from "./observable/Questions";
export * from "./observable/ObservableQuestions";
export * from "./observable/ObservableNodes";
