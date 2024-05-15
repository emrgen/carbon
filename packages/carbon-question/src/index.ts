
import './question.styl'
import { Question } from "./plugins/Question";
import {QuestionTitleComp} from "./renderers/QuestionTitle";
import {Extension} from "@emrgen/carbon-react";
import {ReactRenderer} from "@emrgen/carbon-react";
import {QuestionComp} from "./renderers/Question";
import {QuestionTitle} from "./plugins/QuestionTitle";
import {QuestionDescription} from "./plugins/QuestionDescription";
import {QuestionExplanation} from "./plugins/QuestionExplanation";
import {QuestionType} from "./plugins/QuestionType";
import {MultipleChoiceComp, MultipleChoiceOptionComp} from "./renderers/MultipleChoice";
import {QuestionDescriptionComp} from "./renderers/QuestionDescription";

export const questionExtension: Extension = {
  plugins: [
    new Question(),
    new QuestionTitle(),
    new QuestionDescription(),
    new QuestionType(),
    new QuestionExplanation(),
  ],
  renderers: [
    ReactRenderer.create('question', QuestionComp),
    ReactRenderer.create('questionTitle', QuestionTitleComp),
    ReactRenderer.create('questionDescription', QuestionDescriptionComp),
    ReactRenderer.create('multipleChoice', MultipleChoiceComp),
    ReactRenderer.create('multipleChoiceOption', MultipleChoiceOptionComp),
  ]
};


