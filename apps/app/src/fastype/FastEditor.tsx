import React, { useEffect, useRef } from "react";

import { Fastype } from "@emrgen/fastype-core";
import {
  Transaction,
  extensionPresets,
  useCreateCachedCarbon,
  useCreateCarbon,
} from "@emrgen/carbon-core";
import {
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";
import { carbonUtilPlugins } from "@emrgen/carbon-utils";
import { fastypeBlocks } from "@emrgen/fastype-blocks";
import { fastypeDatabase } from "@emrgen/fastype-database";
import { Box, Spinner, Stack } from "@chakra-ui/react";
import TimeTravel from "./TimeTravel";
import { json } from "stream/consumers";
import FastTree from "./FastTree";
import { cloneDeep } from 'lodash';

const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
  fastypeBlocks,
  fastypeDatabase,
];

const data = {
  name: "carbon",
  children: [
    {
      name: "document",
      children: [
        {
          name: "title",
          children: [text("I am a frame title")],
        },
        // {
        //   name: "divider",
        // },
        section([
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
      attrs: {
        node: {
          picture: {
            src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
          },
        },
      },
    },
  ],
};

  console.log(data);

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
    const onTransaction = (tr: Transaction) => {
      const nodes = tr.app.content.descendants();
      const els = nodes.map((n) => ({id: n.id.toString(), el: tr.app.store.element(n.id)}));
      if (els.some((n) => !n.el)) {
        console.error("missing node", els);
      }
    }

    app.on("transaction", onTransaction);
    return () => {
      app.off("transaction", onTransaction);
    };
  }, [app]);

  return (
    <Stack h="full"  w="full">
      {/* <Editor
        height="60vh"
        onMount={handleEditorDidMount}
        onChange={handleOnChange}
        language="typescript"
        // theme="github-light"
        options={{
          lineNumbers: "off",
          minimap: {
            enabled: false,
          },
          renderLineHighlight: "none",
          scrollbar: {
            vertical: "hidden",
            horizontal: "hidden",
          },
        }}
        defaultValue={String.raw`console.log('done');`}
        loading={<Spinner />}
      /> */}
      <Stack className="fast-editor" flex={1} >
        <Fastype app={app} />
      </Stack>
      {/*<Box pos='absolute' left={0} top={0} py={2} px={0} w='200px' h='full'>*/}
      {/*  <TimeTravel app={app}/>*/}
      {/*</Box>*/}
      {/* <Box h='300px' bg={'#eee'} margin={'0 auto'} w='740px'>
        <FastTree app={app} />
      </Box> */}
    </Stack>
  );
}
