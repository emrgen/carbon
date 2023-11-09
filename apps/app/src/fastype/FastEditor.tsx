import React, { useRef } from "react";

import { Fastype } from "@emrgen/fastype-core";
import {
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
import Editor, { DiffEditor, useMonaco, loader } from "@monaco-editor/react";
import { Box, Spinner, Stack } from "@chakra-ui/react";
import TimeTravel from "./TimeTravel";
import { json } from "stream/consumers";
import FastTree from "./FastTree";

const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
  fastypeBlocks,
];

const data = {
  name: "carbon",
  content: [
    {
      name: "document",
      content: [
        {
          name: "title",
          content: [
            {
              name: "text",
              text: "Carbon ",
            },
            {
              name: "text",
              text: "document",
            },
          ],
        },
        // {
        //   name: "divider",
        // },
        // section([
        //   title([
        //     text("I am "),
        //     text("carbon", { node: { marks: { bold: true } } }),
        //     text(" editor"),
        //   ]),
        // ]),
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

export function FastEditor() {
  const app = useCreateCachedCarbon(data, extensions);

  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    console.log(editor);
  };

  const handleOnChange = (value, event) => {
    console.log(value);
  };

  return (
    <Stack h="full" className="fast-editor" w="full">
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
      <Fastype app={app} />
      {/*<Box pos='absolute' left={0} top={0} py={2} px={0} w='200px' h='full'>*/}
      {/*  <TimeTravel app={app}/>*/}
      {/*</Box>*/}
      <Box h='300px' bg={'#eee'} margin={'0 auto'} w='740px'>
        <FastTree app={app} />
      </Box>
    </Stack>
  );
}
