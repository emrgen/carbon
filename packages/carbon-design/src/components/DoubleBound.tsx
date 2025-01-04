import {
  Affine,
  cornerPoints,
  getPoint,
  IPoint,
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
import { isNumber, max, min, round } from "lodash";
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

const sp = Shaper.from(Affine.fromSize(250, 100)).translate(600, 200);
const sp1 = Shaper.from(Affine.fromSize(300, 200))
  .translate(600, 200)
  .rotate(Math.PI / 10);

const points = [
  getPoint(TransformAnchor.TOP_LEFT),
  getPoint(TransformAnchor.TOP_RIGHT),
  getPoint(TransformAnchor.BOTTOM_RIGHT),
  getPoint(TransformAnchor.BOTTOM_LEFT),
].map((p) => sp.apply(p));

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

    const sides = adjacentSides(handle).map((side) =>
      side.transform(shaper.affine()),
    );
    const anchorPoint = shaper.apply(getPoint(anchor));
    // move sides to points and check the scales, the maximum scaling is the allowed scaling
    const scales = points.map((p) => {
      const scales = sides.map((side) => {
        const before = side.distance(anchorPoint);
        const shifted = side.shiftTo(p);
        const after = shifted.distance(anchorPoint);

        return after / before;
      });

      return max(scales);
    });

    const minScale = max(scales);

    console.log("Min scale", minScale);

    event.setInitState(node.id.toString(), {
      shaper: shaper,
      minScale,
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
      const { beforeLine, shaper, angleLine } = event.getInitState(
        node.id.toString(),
      );
      if (!Shaper.is(shaper)) return;
      if (!Line.is(angleLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;

      // check what is the allowed scaling while avoiding originLine collision
      const afterLine = beforeLine.moveEndBy(dx, dy);
      const angle = toRad(round(toDeg(afterLine.angleBetween(beforeLine))));
      const after = shaper.rotate(angle);
      const centerPoint = after.apply(getPoint(Location.CENTER));
      const { width, height } = after.size();
      const sides = boundSidesFromCorners(
        cornerPoints.map((p) => after.apply(p)),
      );

      // shift the sides to the inner bound corner points and check the scales.
      // the maximum scaling is the allowed scaling
      const scales = sides.map((side, i) => {
        const scales = points.map((p) => {
          const shifted = side.shiftTo(p);
          const distance = 2 * shifted.distance(centerPoint);
          if (i % 2) {
            return distance / width;
          } else {
            return distance / height;
          }
        });

        return max(scales) as number;
      });
      const minScale = max([...scales, 1]) as number;

      const afterScale = after.scale(minScale, minScale, 0, 0);

      const style = afterScale.toStyle();

      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
        ref.current.style.transform = style.transform;
      }

      if (angleHintRef.current) {
        const hintAngle = round(toDeg(after.angle));
        angleHintRef.current.innerText = `${hintAngle}°`;
        angleHintRef.current.style.left = `${event.position.endX + 40}px`;
        angleHintRef.current.style.top = `${event.position.endY + 40}px`;
      }
    } else {
      const { shaper: before, minScale } = event.getInitState(
        node.id.toString(),
      ) as {
        shaper: Shaper;
        originLines: Line[];
        minScale: number;
      };
      console.log("xxxxxxxxxxxxxxxxxxxxxxx", before, node.id.toString(), event);
      if (!Shaper.is(before)) return;
      if (!isNumber(minScale)) return;
      const { deltaX: dx, deltaY: dy } = event.position;

      const change = before.scaleFromDelta(
        dx,
        dy,
        anchor,
        handle,
        ResizeRatio.KEEP,
      );
      const sx = Math.max(change.sx, minScale);
      const sy = Math.max(change.sy, minScale);
      let after = before.scale(sx, sy, change.ax, change.ay);
      // check what is the allowed scaling while avoiding originLine collision
      const style = after.toStyle();
      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.width = style.width;
        ref.current.style.height = style.height;
        ref.current.style.transform = style.transform;
      }
    }
    console.log("xxxxxxxxxxxxxxxxxxxxxxx");
  };

  const onTransformEnd = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log("stop", type, event);
    if (type === TransformType.ROTATE) {
      const { beforeLine: startLine, shaper } = event.getInitState(
        node.id.toString(),
      );
      if (!Line.is(startLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      const currLine = startLine.moveEndBy(dx, dy);
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
      const { shaper: before } = event.getInitState(node.id.toString());
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

  //

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
          background: "rgba(100, 0, 0, 0.5)",
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

function adjacentSides(handle: TransformHandle): Line[] {
  switch (handle) {
    case TransformHandle.TOP:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.TOP_RIGHT),
        ),
      ];
    case TransformHandle.RIGHT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_RIGHT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
    case TransformHandle.BOTTOM:
      return [
        Line.fromPoints(
          getPoint(Location.BOTTOM_LEFT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
    case TransformHandle.LEFT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.BOTTOM_LEFT),
        ),
      ];
    case TransformHandle.TOP_LEFT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.TOP_RIGHT),
        ),
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.BOTTOM_LEFT),
        ),
      ];
    case TransformHandle.TOP_RIGHT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_RIGHT),
          getPoint(Location.TOP_LEFT),
        ),
        Line.fromPoints(
          getPoint(Location.TOP_RIGHT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
    case TransformHandle.BOTTOM_RIGHT:
      return [
        Line.fromPoints(
          getPoint(Location.BOTTOM_RIGHT),
          getPoint(Location.TOP_RIGHT),
        ),
        Line.fromPoints(
          getPoint(Location.BOTTOM_RIGHT),
          getPoint(Location.BOTTOM_LEFT),
        ),
      ];
    case TransformHandle.BOTTOM_LEFT:
      return [
        Line.fromPoints(
          getPoint(Location.BOTTOM_LEFT),
          getPoint(Location.TOP_LEFT),
        ),
        Line.fromPoints(
          getPoint(Location.BOTTOM_LEFT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
  }

  return [];
}

interface InnerBoundProps {
  node: Node;
}

const sp3 = Shaper.from(Affine.fromSize(450, 400))
  .rotate(Math.PI / 4)
  .translate(600, 600);
const sp4 = Shaper.from(Affine.fromSize(300, 300))
  .translate(600, 630)
  .rotate(Math.PI / 4);

const points2 = [
  getPoint(TransformAnchor.TOP_LEFT),
  getPoint(TransformAnchor.TOP_RIGHT),
  getPoint(TransformAnchor.BOTTOM_RIGHT),
  getPoint(TransformAnchor.BOTTOM_LEFT),
].map((p) => sp3.apply(p));

const InnerBound = (props: InnerBoundProps) => {
  const { node } = props;
  const refRef = useRef<any>();
  const leftRef = useRef<any>();
  const midRef = useRef<any>();
  const rightRef = useRef<any>();
  const ref = useRef<any>();
  const angleHintRef = useRef<any>();
  const [bounds, setBounds] = useState(points2);
  const [shaper, setShaper] = useState(sp4);
  const [style, setStyle] = useState(sp4.toStyle());
  const [transforming, setTransforming] = useState(false);

  const onTransformStart = (
    type: TransformType,
    anchor: TransformAnchor,
    handle: TransformHandle,
    event: DndEvent,
  ) => {
    console.log(type, event);
    setTransforming(true);

    const sides = anchorLines(anchor).map((side) =>
      side.transform(shaper.affine()),
    );
    const boundSides = [
      Line.fromPoints(points2[0], points2[1]),
      Line.fromPoints(points2[1], points2[2]),
      Line.fromPoints(points2[2], points2[3]),
      Line.fromPoints(points2[3], points2[0]),
    ];

    // move sides to points and check the scales, the maximum scaling is the allowed scaling
    const scales = sides.map((side, i) => {
      const scales = boundSides.map((bound) => {
        const point = side
          .extendStart(1000)
          .extendEnd(1000)
          .intersection(bound);

        // console.log(side, bound, point);
        if (!point) {
          return {};
        }

        const before = side.vector();
        const after = side.moveEndTo(point).vector();

        if (
          anchor === TransformAnchor.TOP ||
          anchor === TransformAnchor.BOTTOM
        ) {
          console.log("xxx", after.factorOf(before));
          return {
            sy: after.factorOf(before),
          };
        }

        if (
          anchor === TransformAnchor.LEFT ||
          anchor === TransformAnchor.RIGHT
        ) {
          return {
            sx: after.factorOf(before),
          };
        }

        if (i == 0) {
          return {
            sx: after.factorOf(before),
          };
        }

        if (i == 1) {
          return {
            sy: after.factorOf(before),
          };
        }

        return {};
      });

      const sx = scales.filter((s) => s.sx).map((s) => s.sx as number);
      const sy = scales.filter((s) => s.sy).map((s) => s.sy as number);

      const sxp = sx.filter((s) => s > 0);
      const syp = sy.filter((s) => s > 0);
      const sxn = sx.filter((s) => s < 0);
      const syn = sy.filter((s) => s < 0);

      return {
        sxMin: max(sxn),
        syMin: max(syn),
        sxMax: min(sxp),
        syMax: min(syp),
      };
    });

    const scaleLimits = {
      sxMin: max(scales.map((s) => s.sxMin)),
      syMin: max(scales.map((s) => s.syMin)),
      sxMax: min(scales.map((s) => s.sxMax)),
      syMax: min(scales.map((s) => s.syMax)),
    };

    console.log(scaleLimits);

    event.setInitState(node.id.toString(), {
      shaper: shaper,
      scaleLimits,
      startPoint: shaper.apply(getPoint(handle)),
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
        minScale,
      } = event.getInitState(node.id.toString());
      if (!Line.is(before)) return;
      if (!Line.is(angleLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;

      // check what is the allowed scaling while avoiding originLine collision

      const afterLine = before.moveEndBy(dx, dy);
      const angle = toRad(round(toDeg(afterLine.angleBetween(before))));
      const after = shaper.rotate(angle);
      const style = after.toStyle();

      if (ref.current) {
        ref.current.style.left = style.left;
        ref.current.style.top = style.top;
        ref.current.style.transform = style.transform;
      }

      if (angleHintRef.current) {
        let hintAngle = round(toDeg(after.angle));
        angleHintRef.current.innerText = `${hintAngle}°`;
        angleHintRef.current.style.left = `${event.position.endX + 40}px`;
        angleHintRef.current.style.top = `${event.position.endY + 40}px`;
      }
    } else {
      const {
        shaper: before,
        scaleLimits,
        startPoint,
      } = event.getInitState(node.id.toString()) as {
        shaper: Shaper;
        originLines: Line[];
        scaleLimits: {
          sxMin: number;
          syMin: number;
          sxMax: number;
          syMax: number;
        };
        startPoint: IPoint;
      };

      if (!Shaper.is(before)) return;

      let { deltaX: dx, deltaY: dy } = event.position;
      const outerBoundSides = boundSidesFromCorners(points2);

      const change = before.scaleFromDelta(
        dx,
        dy,
        anchor,
        handle,
        ResizeRatio.FREE,
      );

      // draw a line from cursor to side and check the intersection
      let sx = (() =>
        (change.sx > 0
          ? min([scaleLimits.sxMax, change.sx])
          : max([scaleLimits.sxMin, change.sx])) ?? change.sx)();
      let sy = (() =>
        (change.sy > 0
          ? min([scaleLimits.syMax, change.sy])
          : max([scaleLimits.syMin, change.sy])) ?? change.sy)();

      let after = before.scale(sx, sy, change.ax, change.ay);
      const handlePoint = after.apply(getPoint(handle));
      const outerBoundCenterPoint = sp4.center();
      const boundSide = boundIntersection(
        outerBoundSides,
        outerBoundCenterPoint,
        handlePoint,
      );

      if (boundSide) {
        // console.log("outsize", boundSide);
        const centerPoint = after.apply(getPoint(Location.CENTER));
        const cursorPoint = { x: startPoint.x + dx, y: startPoint.y + dy };
        const boundSides = boundSidesFromCorners(
          cornerPoints.map((p) => after.apply(p)),
        );

        const pointDistance = (point: IPoint) => {
          // the point will cause the shape to go out of bound
          if (boundIntersection(boundSides, centerPoint, point)) {
            return Infinity;
          }

          return Line.fromPoints(point, cursorPoint).length;
        };

        const binarySearch = (
          start: number,
          end: number,
          fn: (point: IPoint) => number,
        ) => {
          let startDistance = fn(boundSide.pointAtLength(start));
          let endDistance = fn(boundSide.pointAtLength(end));
          let distance = startDistance;
          if (startDistance > endDistance) {
            const tmp = start;
            start = end;
            end = tmp;
            distance = endDistance;
          }

          for (let b = end - start; Math.abs(b) > 0.001; b /= 2) {
            while (start < end ? start + b <= end : start + b >= end) {
              const point = boundSide.pointAtLength(start + b);
              const d = fn(point);
              if (d < distance) {
                distance = d;
                start += b;
              } else {
                break;
              }
            }
          }

          return boundSide.pointAtLength(start);
        };

        // find the closest point on the bound side to the cursor that keeps all the corners inside the bound
        // get the reference point what surely on the bound side and inside the bound
        const anchorPoint = after.apply(getPoint(anchor));
        const refPoint = boundSide.intersection(
          Line.fromPoints(anchorPoint, handlePoint),
        );
        if (!refPoint) {
          console.error("no ref point");
          return;
        }

        const refLength = boundSide.pointLength(refPoint);
        const cursorProjectionPoint = boundSide.projectionPoint(cursorPoint);
        const projectionLength = boundSide.pointLength(cursorProjectionPoint);

        const anchorOppositePoint = binarySearch(
          refLength,
          projectionLength,
          pointDistance,
        );

        const startHandlePoint = shaper.apply(getPoint(handle));
        const hdx = anchorOppositePoint.x - startHandlePoint.x;
        const hdy = anchorOppositePoint.y - startHandlePoint.y;
        after = before.resize(hdx, hdy, anchor, handle, ResizeRatio.FREE);

        if (midRef.current) {
          midRef.current.style.transform = `translate(${anchorOppositePoint.x}px, ${anchorOppositePoint.y}px)`;
        }
      }

      // check what is the allowed scaling while avoiding originLine collision
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
      const { beforeLine: startLine, shaper } = event.getInitState(
        node.id.toString(),
      );
      if (!Line.is(startLine)) return;
      const { deltaX: dx, deltaY: dy } = event.position;
      const currLine = startLine.moveEndBy(dx, dy);
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
      const { shaper: before } = event.getInitState(node.id.toString());
      if (!Shaper.is(before)) return;
      const size = before.size();
      const { deltaX: dx, deltaY: dy } = event.position;
      const after = before.resize(dx, dy, anchor, handle, ResizeRatio.FREE);

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

  console.log(sp3.affine().translation());

  return (
    <>
      <div
        ref={midRef}
        style={{
          position: "absolute",
          left: "-6px",
          top: "-6px",
          width: "12px",
          height: "12px",
          background: "green",
          borderRadius: "50%",
        }}
      ></div>

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
        style={{
          position: "absolute",
          ...sp3.toStyle(),
          background: "rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <img
          style={{
            zIndex: 1000,
            position: "absolute",
            height: "100%",
            width: "100%",
          }}
          src={
            "https://ecard.enter-media.org/upload/iblock/e82/e8228ce009c54730db55885ae4ee5faa.jpg"
          }
          alt={"asf"}
        />
      </div>
      <div
        style={{
          zIndex: 1000,
          position: "absolute",
          ...shaper.toStyle(),
          // boxShadow: "0 0 0 1000px rgba(0,0,0,0.4)",
        }}
      />
      <div
        ref={ref}
        style={{
          position: "absolute",
          border: "1px solid red",
          borderRightColor: "blue",
          ...style,
        }}
      />
      <div className={"visible-image"}></div>

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

const boundIntersection = (bounds: Line[], start: IPoint, end: IPoint) => {
  const line = Line.fromPoints(start, end);
  return bounds.find((side) => side.intersection(line));
};

function anchorLines(anchor: TransformAnchor): Line[] {
  const anchorPoint = getPoint(anchor);
  const anchorLine = (point: IPoint) => Line.fromPoints(anchorPoint, point);

  switch (anchor) {
    case TransformAnchor.TOP:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.BOTTOM_LEFT),
        ),
        Line.fromPoints(
          getPoint(Location.TOP_RIGHT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
    case TransformAnchor.RIGHT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_RIGHT),
          getPoint(Location.TOP_LEFT),
        ),
        Line.fromPoints(
          getPoint(Location.BOTTOM_RIGHT),
          getPoint(Location.BOTTOM_LEFT),
        ),
      ];
    case TransformAnchor.BOTTOM:
      return [
        Line.fromPoints(
          getPoint(Location.BOTTOM_LEFT),
          getPoint(Location.TOP_LEFT),
        ),
        Line.fromPoints(
          getPoint(Location.BOTTOM_RIGHT),
          getPoint(Location.TOP_RIGHT),
        ),
      ];
    case TransformAnchor.LEFT:
      return [
        Line.fromPoints(
          getPoint(Location.TOP_LEFT),
          getPoint(Location.TOP_RIGHT),
        ),
        Line.fromPoints(
          getPoint(Location.BOTTOM_LEFT),
          getPoint(Location.BOTTOM_RIGHT),
        ),
      ];
    case TransformAnchor.TOP_LEFT:
      return [
        anchorLine(getPoint(Location.TOP_RIGHT)),
        anchorLine(getPoint(Location.BOTTOM_LEFT)),
      ];
    case TransformAnchor.TOP_RIGHT:
      return [
        anchorLine(getPoint(Location.TOP_LEFT)),
        anchorLine(getPoint(Location.BOTTOM_RIGHT)),
      ];
    case TransformAnchor.BOTTOM_RIGHT:
      return [
        anchorLine(getPoint(Location.BOTTOM_LEFT)),
        anchorLine(getPoint(Location.TOP_RIGHT)),
      ];
    case TransformAnchor.BOTTOM_LEFT:
      return [
        anchorLine(getPoint(Location.BOTTOM_RIGHT)),
        anchorLine(getPoint(Location.TOP_LEFT)),
      ];
  }

  return [];
}

// NOTE: first and third lines are horizontal, second and fourth lines are vertical
// this fact is used by the dependent functions
function boundSidesFromCorners(corners: IPoint[]): Line[] {
  return [
    Line.fromPoints(corners[0], corners[1]),
    Line.fromPoints(corners[1], corners[2]),
    Line.fromPoints(corners[2], corners[3]),
    Line.fromPoints(corners[3], corners[0]),
  ];
}