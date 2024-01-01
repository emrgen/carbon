
import './question.styl'
import { DocumentComp } from "@emrgen/carbon-blocks";
import { Question } from "./plugins/Question";
import { Extension, ReactRenderer } from '@emrgen/carbon-core';
import { QuestionAnswerComp } from "./renderers/Answer";
import { QuestionAnswer } from "./plugins/Answer";

export const questionExtension: Extension = {
  plugins: [new Question(), new QuestionAnswer()],
  renderers: [
    ReactRenderer.create('question', DocumentComp),
    ReactRenderer.create('questionAnswer', QuestionAnswerComp),
  ]
};


