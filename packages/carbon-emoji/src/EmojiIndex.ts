import MiniSearch from 'minisearch'
import data from '@emoji-mart/data'
import { values } from 'lodash';

export class EmojiIndex {
  static index = new MiniSearch({
    fields: ['id', 'name', 'keywords', 'skins'],
    storeFields: ['name', 'short_names', 'keywords'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
    },
  });

  static init() {
    // @ts-ignore
    this.index.addAll(values(data.emojis));
  }

  static search(query: string) {
    return this.index.search(query);
  }

  static getEmoji(id: string) {
    // @ts-ignore
    return data.emojis[id];
  }
}

EmojiIndex.init();
