// import { Box, Textarea } from "@chakra-ui/react";
// import React, { useEffect, useRef } from "react";
//
// import ResizeTextarea from "react-textarea-autosize";
//
// import {
//   ActionOrigin,
//   BlockContent,
//   CarbonBlock,
//   Pin,
//   PinnedSelection,
//   RendererProps,
//   preventAndStop,
//   stop,
//   useCarbon,
//   useNodeChange,
//   useSelectionHalo,
// } from "@emrgen/carbon-core";
// import { Highlight, themes } from "prism-react-renderer";
// import {
//   useCombineConnectors,
//   useConnectorsToProps,
//   useDragDropRectSelect,
// } from "@emrgen/carbon-dragon";
// import ReactCodeMirror from "@uiw/react-codemirror";
//
//
// export const CodeComp = (props: RendererProps) => {
//   const { node } = props;
//   const react = useCarbon();
//   const ref = useRef(null);
//
//   const selection = useSelectionHalo(props);
//   const dragDropRect = useDragDropRectSelect({ node, ref });
//   const connectors = useConnectorsToProps(
//     useCombineConnectors(dragDropRect, selection)
//   );
//
//   return (
//     <CarbonBlock node={node} ref={ref} custom={connectors}>
//       <Box contentEditable={false} suppressContentEditableWarning>
//         <CodeContent node={node.child(0)!} />
//         {selection.SelectionHalo}
//       </Box>
//     </CarbonBlock>
//   );
// };
//
//
// // const CodeContentMirror = (props: RendererProps) => {
// //   const { node, version } = useNodeChange(props);
// //   const react = useCarbon();
// //
// //   console.log(node.textContent);
// //
// //   return <ReactCodeMirror
// //     value={node.textContent!}
// //     options={{
// //       // theme: 'monokai',
// //       // keyMap: 'sublime',
// //       // mode: 'jsx',
// //       language: 'go',
// //     }}
// //     onFocus={() => {
// //       react.tr.selectNodes([]).Dispatch();
// //       react.disable();
// //     }}
// //     onBlur={() => react.enable()}
// //     onChange={(value) => {
// //       react.enable(() => {
// //         const text = react.schema.text(value)!;
// //         react.tr.setContent(node.id, BlockContent.create([text])).Dispatch();
// //       });
// //     }}
// //   />
// // }
//
//
// const CodeContent = (props: RendererProps) => {
//   const { node } = props;
//   const react = useCarbon();
//   const refText = useRef<HTMLTextAreaElement>(null);
//
//   useEffect(() => {
//     if (!node.parent) return;
//     if (node.parent.properties.node.typeChanged) {
//       console.log("focus");
//       react.tr
//         .Update(node.parent.id, { node: { typeChanged: false } })
//         .Dispatch();
//       refText.current?.focus();
//     }
//   }, [react, node]);
//
//   useEffect(() => {
//     const onFocus = () => {
//       const element = refText.current;
//       if (!element) return;
//       console.log("focus");
//       element.focus();
//       element.setSelectionRange(element.value.length, element.value.length);
//     };
//
//     node.on("focus", onFocus);
//     return () => {
//       node.off("focus", onFocus);
//     };
//   }, [node, refText]);
//
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     // stop(e);
//     if (e.key == "Tab") {
//       e.preventDefault();
//     }
//
//     if (e.key == "Enter") {
//       if (react.selection.isBlock) {
//         e.preventDefault();
//       }
//     }
//
//     if (e.key == "Escape") {
//       stop(e);
//       react.parkCursor();
//       // react.tr.selectNodes([node.parent!.id]).Dispatch();
//     }
//
//     // if back spaced at the beginning of the line
//     // convert to paragraph
//     if (e.key == "Backspace") {
//       const textarea = e.target as HTMLTextAreaElement;
//       const { selectionStart, selectionEnd } = textarea;
//       const parent = node.parent!;
//
//       if (selectionStart == 0 && selectionEnd == 0) {
//         preventAndStop(e);
//         // NOTE: when the text area is removed in paragraph the onBlur is not called.
//         // so we need to enable the editor here.
//         react.enable();
//
//         const { tr } = react;
//         tr.Change(parent.id, parent.name, "paragraph");
//         tr.Update(parent.id, { node: { typeChanged: true } });
//         tr.Select(
//           PinnedSelection.fromPin(Pin.toStartOf(parent)!),
//           ActionOrigin.UserInput
//         );
//         tr.Dispatch();
//       }
//     }
//   };
//
//   const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     stop(e);
//   };
//
//   const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     stop(e);
//     const { value } = e.target;
//     const text = react.schema.text(value)!;
//     react.enable(() => {
//       react.tr.SetContent(node.id, BlockContent.create([text])).Dispatch();
//     });
//   };
//
//   return (
//     <CarbonBlock node={node}>
//       <Box className="fastype-code-content">
//         <Highlight theme={themes.github} code={node.textContent!} language="go">
//           {({ className, style, tokens, getLineProps, getTokenProps }) => (
//             <pre className="fastype-pre" style={style}>
//               <code className="fastype-code">
//                 {tokens.map((line, i) => (
//                     <span key={i} {...getLineProps({ line })}>
//                     {/*<span className='line-number'>{i + 1}.</span>*/}
//                     {line.map((token, key) => (
//                       <span key={key} {...getTokenProps({ token })} />
//                     ))}
//                   </span>
//                 ))}
//               </code>
//             </pre>
//           )}
//         </Highlight>
//       </Box>
//       <Box pos={"absolute"} top={0} left={0} w="full">
//         <Textarea
//           ref={refText}
//           className="fastype-code-textarea"
//           defaultValue={node?.textContent}
//           placeholder="Write code here..."
//           _focus={{
//             outline: "none",
//             boxShadow: "none",
//             border: "none",
//           }}
//           borderRadius={0}
//           display={"block"}
//           border={"none"}
//           overflow="hidden"
//           as={ResizeTextarea}
//           resize={"none"}
//           onKeyDown={handleKeyDown}
//           onKeyUp={handleKeyUp}
//           onChange={handleOnChange}
//           onFocus={() => {
//             react.tr.selectNodes([]).Dispatch();
//             react.disable();
//           }}
//           onBlur={() => react.enable()}
//         />
//       </Box>
//     </CarbonBlock>
//   );
// };
