// import {
//   CarbonBlock,
//   RendererProps,
//   preventAndStop,
//   useCarbon,
//   useNodeChange,
//   useSelectionHalo,
// } from "@emrgen/carbon-core";
// import { HiMiniBars3BottomLeft, HiMiniBars3BottomRight } from "react-icons/hi2";
// import React, { useCallback, useRef } from "react";
//
// import { LuAlignCenter } from "react-icons/lu";
//
// export function VideoComp(props: RendererProps) {
//   const { node } = props;
//   const react = useCarbon();
//   const { SelectionHalo, attributes, isSelected } = useSelectionHalo(props);
//   const ref = useRef<HTMLDivElement>(null);
//
//   const handleClick = (e) => {
//     preventAndStop(e);
//
//     // react.emit(
//     //   "show:options:menu",
//     //   node.id,
//     //   ref.current?.getBoundingClientRect()
//     // );
//
//     // react.tr.selectNodes([node.id]).Dispatch();
//   };
//
//   const onClick = useCallback(
//     (e) => {
//       // preventAndStop(e);
//       // react.tr.selectNodes([]).Dispatch();
//     },
//     [react.tr]
//   );
//
//   return (
//     <CarbonBlock {...props} custom={{ ...attributes, onClick }}>
//       <div className="video-container" onClick={handleClick} ref={ref}>
//         {/* <img src={node.attrs.node.src} alt="" /> */}
//         <div className="video-overlay">Video</div>
//       </div>
//       {SelectionHalo}
//     </CarbonBlock>
//   );
// }
