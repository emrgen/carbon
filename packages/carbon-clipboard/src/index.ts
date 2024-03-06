import {Optional} from "@emrgen/types";
import {Node} from "@emrgen/carbon-core";
import {marked} from "marked";

async function parse(): Promise<Optional<any[]>> {
  navigator.clipboard.readText().then(text => {
    navigator.clipboard.read().then(data => {
      try {
        for (const item of data) {
          for (const type of item.types) {
            console.log(type)
            if (type === 'text/html') {
              item.getType(type).then(blob => {
                blob.text().then(text => {
                  console.log('blob text', text);
                })
              });
              break
            }

            if (type === 'text/plain') {
              item.getType(type).then(blob => {
                blob.text().then(text => {
                  console.log('blob text', text);
                })
              });
              break
            }

            if (type === 'image/png') {
              item.getType(type).then(blob => {
                console.log('blob', blob);
              });
              break
            }
          }
        }
      } catch (e) {
        console.error('clipboard paste error', e);
      }
    })

    marked.parse(text, {
      walkTokens(token) {
        console.log('token', token);
      },
    });

    console.log('clipboard paste');
    console.log(text)
  });

  return [];
}

const clipboard = {
  parse
}

export default clipboard;
