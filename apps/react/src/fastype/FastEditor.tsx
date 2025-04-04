import { Stack } from "@chakra-ui/react";
import { paragraph, text, title } from "@emrgen/carbon-blocks";

import { useCreateCarbon } from "@emrgen/carbon-react";

import { BlockMenu } from "@emrgen/carbon-utils";

import { Fastype } from "@emrgen/fastype-core";
import { cloneDeep } from "lodash";
import React, { useEffect, useRef } from "react";

const extensions = [
  // extensionPresets,
  // blockPresets,
  // carbonUtilPlugins,
  // fastypeBlocks,
  // fastypeDatabase,
];

const data = {
  name: "carbon",
  children: [
    {
      name: "page",
      children: [
        {
          name: "title",
          children: [text("I am a frame title")],
        },
        // {
        //   name: "divider",
        // },
        paragraph([
          title([
            text("I am "),
            text("carbon", { node: { marks: { bold: true } } }),
            text(" editor"),
          ]),
        ]),
        // node("frame", [
        //   title([
        //     text("I am a frame title"),
        //   ]),
        // ]),
        //         node("equation", [
        //           title([
        //             // text("\\begin{matrix}\n1 & 2 & 3\\\\\na & b & c\n\\end{matrix}"),
        //             text(String.raw`\ce{CO2 + C -> 2 CO}`),
        //           ]),
        //         ]),
        //         node("code", [
        //           title([
        //             text(String.raw`function name() {
        //   console.log("hello world");
        // }`),
        //           ]),
        //         ]),

        // {
        //   name: "content",
        // },
        // node("image", [], {
        //   node: {
        //     src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
        //   },
        // }),
        // node("video", [], {
        //   node: {
        //     url: "https://www.youtube.com/watch?v=yFswDJPvtPY&rel=0",
        //     provider: 'youtube',
        //   },
        // }),
      ],
      props: {
        "remote/node": {
          picture: {
            src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
          },
        },
      },
    },
  ],
};

export function FastEditor({ name = "carbon" }) {
  const app = useCreateCarbon(name, Object.freeze(cloneDeep(data)), extensions);

  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    console.log(editor);
  };

  const handleOnChange = (value, event) => {
    console.log(value);
  };

  useEffect(() => {
    //   const onTransaction = (tr: Transaction) => {
    //     const nodes = tr.react.content.descendants();
    //     const els = nodes.map((n) => ({id: n.id.toString(), el: tr.react.store.element(n.id)}));
    //     if (els.some((n) => !n.el)) {
    //       console.error("missing node", els);
    //     }
    //   }
    //
    //   react.on("transaction", onTransaction);
    //   return () => {
    //     react.off("transaction", onTransaction);
    //   };
  }, [app]);

  return (
    <Stack h="full" w="full">
      <Stack className="fast-editor" flex={1}>
        <Fastype app={app}>
          {/* <FastypeCursor react={react} /> */}
          <BlockMenu />
        </Fastype>
      </Stack>

      {/*<Box pos='absolute' left={0} top={0} py={2} px={0} w='200px' h='full'>*/}
      {/*  <TimeTravel react={react}/>*/}
      {/*</Box>*/}
      {/* <Box h='300px' bg={'#eee'} margin={'0 auto'} w='740px'>
        <FastTree react={react} />
      </Box> */}
    </Stack>
  );
}
