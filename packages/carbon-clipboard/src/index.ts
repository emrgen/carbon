import {Optional} from "@emrgen/types";
import {marked} from "marked";

async function parse(): Promise<Optional<any[]>> {
  const nodes: any[] = [];
  console.log('xxxxxxxxxxxxxxxxx')
  navigator.clipboard.read().then(data => {
    try {
      for (const item of data) {
        console.log('XXXX')
        let consumed = false;
        for (const type of item.types) {
          console.log(type)
          if (!consumed && type === 'text/plain') {
            const p1 = item.getType(type).then(blob => {
              const p2 = blob.text().then(text => {
                nodes.push({
                  name: 'section',
                  children: [{
                    name: 'title',
                    children: [{
                      type: 'text',
                      text: text,
                    }],
                  }],
                });
                console.log('blob text', text);
              })
            });
            consumed = true;
          }

          if (!consumed && type === 'text/html') {
            item.getType(type).then(blob => {
              blob.text().then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const body = doc.querySelector('body');
                console.log('doc', body);
                console.log('doc string', body?.innerHTML);
                // console.log('blob text', text);
              })
            });
            consumed = true;
          }

          if (!consumed && type === 'web application/carbon') {
            item.getType(type).then(blob => {
              blob.text().then(text => {
                const slice = JSON.parse(text);
                console.log('slice', slice);
              })
            });
            consumed = true;
          }
        }
      }
    } catch (e) {
      console.error('clipboard paste error', e);
    }

    return nodes;
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

  return [];
}

const setClipboard = async function (text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  return await navigator.clipboard.write(data);
}

const clipboard = {
  parse,
  setClipboard
}

export default clipboard;
