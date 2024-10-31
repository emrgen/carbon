import {
  Affine,
  getPoint,
  Line,
  Location,
  ResizeRatio,
  Shaper,
  toDeg,
  toRad,
  TransformAnchor,
  TransformHandle,
  TransformType,
} from "@emrgen/carbon-affine";
import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { isArray, round } from "lodash";
import { ReactNode, useRef, useState } from "react";
import { CarbonTransformControls } from "./CarbonTransformControls";
import { ShowCurrentAngleHint } from "./ShowCurrentAngleHint";

interface DoubleBoundProps {
  node: Node;
  // affine: Affine;
  // onTransformStart: TransformHandler;
  // onTransformMove: TransformHandler;
  // onTransformEnd: TransformHandler;
}

// double bound create bounding box within another bounding box
// constraints: inner bound should be within outer bound
// inner bound should be draggable within outer bound
// inner bound should be resizable within outer bound
// outer bound should be resizable
// outer bound should be draggable
// while resizing, rotating, dragging the outer bound, outer bound should not overlap with inner bound
// while resizing, rotating, dragging the inner bound, the overlapping should hide the overlapped region
export const DoubleBound = (props: DoubleBoundProps) => {
  const { node } = props;

  return (
    <>
      <InnerBound node={node} />
      {/*uses */}
      <OuterBound node={node} />
    </>
  );
};

interface OuterBoundProps {
  node: Node;
  children?: ReactNode;
}

const sp = Shaper.from(Affine.fromSize(250, 100)).translate(400, 800);
const sp1 = Shaper.from(Affine.fromSize(300, 200)).translate(400, 800);

const points = [
  getPoint(TransformAnchor.TOP_LEFT),
  getPoint(TransformAnchor.TOP_RIGHT),
  getPoint(TransformAnchor.BOTTOM_RIGHT),
  getPoint(TransformAnchor.BOTTOM_LEFT),
].map((p) => sp.apply(p));

function findNewSize() {}

const OuterBound = (props: OuterBoundProps) => {
  const { node, children } = props;
  const ref = useRef<any>();
  const angleHintRef = useRef<any>();
  const [bounds, setBounds] = useState(points);
  const [shaper, setShaper] = useState(sp1);
  const [style, setStyle] = useState(sp1.toStyle());
  const [transforming, setTransforming] = useState(false);

  const onTransformStart = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log(type, event);
    setTransforming(true);
    event.setState({
      shaper: shaper,
      originLines: [
        Line.fromPoint(getPoint(Location.TOP_LEFT)).extendStart(99999),
        Line.fromPoint(getPoint(Location.BOTTOM_RIGHT)).extendStart(99999),
        Line.fromPoint(getPoint(Location.TOP_RIGHT)).extendStart(99999),
        Line.fromPoint(getPoint(Location.BOTTOM_LEFT)).extendStart(99999),
      ],
      beforeLine: Line.fromPoint(getPoint(handle)).transform(shaper.affine()),
      angleLine: Line.fromPoint(getPoint(Location.BOTTOM)),
    });
  };
  const onTransformMove = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    if (type === TransformType.ROTATE) {
      const {
        beforeLine: before,
        shaper,
        angleLine,
        originLines,
      } = event.state;
      if (!Line.is(before)) return;
      if (!Line.is(angleLine)) return;
      if (!isArray(originLines) && originLines.length !== 4) return;
      const { deltaX: dx, deltaY: dy } = event.position;

      // check what is the allowed scaling while avoiding originLine collision

      const after = before.moveEnd(dx, dy);
      const angle = toRad(round(toDeg(after.angleBetween(before))));
      const style = shaper.rotate(angle).toStyle();

      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
      }

      // if (angleHintRef.current) {
      //   // calculate the angle hint (some weird math)
      //   let hintAngle = round(toDeg(after.angle)) - 90;
      //   if (hintAngle < -180) {
      //     hintAngle = (360 + hintAngle) % 360;
      //   }
      //
      //   angleHintRef.current.innerText = `${hintAngle}°`;
      //   angleHintRef.current.style.left = `${event.position.endX + 40}px`;
      //   angleHintRef.current.style.top = `${event.position.endY + 40}px`;
      // }
    } else {
      const { shaper: before, originLines } = event.state;
      if (!Shaper.is(before)) return;
      if (!isArray(originLines) && originLines.length !== 4) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      let after = before.resize(dx, dy, anchor, handle, ResizeRatio.KEEP);
      // check what is the allowed scaling while avoiding originLine collision
      const { width, height } = after.size();

      // const w = max(4, width);
      //   const h = max(4, height);
      //   if (w <= 4 || h <= 4) {
      //     after = before.resizeTo(w, h, anchor, handle);
      // }

      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
        ref.current.style.transform = style.transform;
      }
    }
  };

  const onTransformEnd = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log("stop", type, event);
    if (type === TransformType.ROTATE) {
      const { beforeLine: startLine, shaper } = event.state;
      if (!Line.is(startLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      const currLine = startLine.moveEnd(dx, dy);
      const angle = toRad(round(toDeg(currLine.angleBetween(startLine))));
      const after = shaper.rotate(angle);
      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
      }

      setShaper(after);
    } else {
      const { shaper: before } = event.state;
      if (!Shaper.is(before)) return;
      const size = before.size();
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = before.resize(dx, dy, anchor, handle, ResizeRatio.KEEP);

      const style = after.toStyle();
      setShaper(after);

      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
      }
    }

    setTransforming(false);
  };

  return (
    <>
      {bounds.map((p, i) => (
        <div
          className={"outer-bound-constraint-points"}
          key={i}
          style={{
            position: "absolute",
            left: "-5px",
            top: "-5px",
            width: "10px",
            height: "10px",
            transform: `translate(${p.x}px, ${p.y}px)`,
          }}
        />
      ))}
      <div
        ref={ref}
        style={{
          position: "absolute",
          border: "1px solid black",
          ...style,
        }}
      >
        {children}
      </div>
      {!transforming && (
        <CarbonTransformControls
          shaper={shaper}
          node={node}
          onTransformStart={onTransformStart}
          onTransformMove={onTransformMove}
          onTransformEnd={onTransformEnd}
        />
      )}
      <ShowCurrentAngleHint ref={angleHintRef} isRotating={transforming} />
    </>
  );
};

interface InnerBoundProps {
  node: Node;
}

const InnerBound = (props: InnerBoundProps) => {
  const { node } = props;

  return (
    <div
      style={{
        position: "absolute",
        border: "1px solid red",
      }}
    />
  );
};
