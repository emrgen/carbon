import { BeforePlugin } from "@emrgen/carbon-core";
import data from '@emoji-mart/data'

console.log(data);


export class EmojiPicker extends BeforePlugin {
  name = "emojiPicker";
}
