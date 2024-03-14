import {ReactRenderer} from "@emrgen/carbon-react";
import {FlashComp} from "./renderers/Flash";
import {FlashCard} from "./plugins/FlashCard";
import './flash.styl'

export const flashComp = ReactRenderer.create('flashCard', FlashComp)

export const flashPlugin = new FlashCard();
