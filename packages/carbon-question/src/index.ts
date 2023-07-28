
import './question.styl'
import { DocumentComp } from "@emrgen/carbon-blocks";
import { Question } from "./plugins/Question";
import { Extension, Renderer } from '@emrgen/carbon-core';
import { QuestionAnswerComp } from "./renderers/Answer";
import { QuestionAnswer } from "./plugins/Answer";

export const questionExtension: Extension = {
  plugins: [new Question(), new QuestionAnswer()],
  renderers: [
    Renderer.create('question', DocumentComp),
    Renderer.create('questionAnswer', QuestionAnswerComp),
  ]
};


