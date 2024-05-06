import {Optional} from "@emrgen/types";
import {parseText} from "./parser/text";

async function parse(): Promise<Optional<any[]>> {
  const nodes: any[] = [];
  return new Promise((resolve, reject) => {
    navigator.clipboard.read().then(data => {
      try {
        for (const item of data) {
          console.log('types', item.types);

          let consumed = false;
          for (const type of item.types) {
            // parse text content to carbon slice
            if (!consumed && type === 'text/plain') {
              item.getType(type).then(blob => {
               blob.text().then(text => {
                 console.log(text)
                  const slice = parseText(text);
                  resolve(nodes);
                })
              });
              // break
            }

            // TODO: parse html content to carbon slice
            if (!consumed && type === 'text/html') {
              item.getType(type).then(blob => {
                blob.text().then(text => {
                  console.log(text)
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(text, 'text/html');
                  const body = doc.querySelector('body');
                  console.log('doc', body);
                  console.log('doc string', body?.innerHTML);
                  // console.log('blob text', text);
                })
              });
              // break
            }

            // parse web application/carbon content to carbon slice
            if (!consumed && type === 'web application/carbon') {
              item.getType(type).then(blob => {
                blob.text().then(text => {
                  const slice = JSON.parse(text);
                  console.log('slice', slice);
                })
              });
              break
            }
          }
        }
      } catch (e) {
        console.error('clipboard paste error', e);
        reject(e);
      }
    })

    // navigator.clipboard.readText().then(text => {
    //   marked.parse(text, {
    //     walkTokens(token) {
    //       console.log('token', token);
    //     },
    //   });
    //
    //   console.log('clipboard paste');
    //   console.log(text)
    // });
  })
}

interface ClipboardItemType {
  type: string
  data: string
}

const setClipboard = async function (dateItems: ClipboardItemType[]) {
  const data = dateItems.map(({type, data}) => {
    const blob = new Blob([data], {type});
    return {[type]: blob};
  }).reduce((acc, item) => {
    return {...acc, ...item};
  }, {});

  const item = [new ClipboardItem(data)];
  return await navigator.clipboard.write(item);
}

const clipboard = {
  parse,
  setClipboard
}

export default clipboard;
