import { forwardRef, useMemo } from "react";

interface ShowCurrentAngleHintProps {
  isRotating: boolean;
}

// shows the current angle hint when rotating, the position is calculated by the parent component and set via ref.current.style
export const InnerShowCurrentAngleHint = (
  props: ShowCurrentAngleHintProps,
  ref: React.Ref<HTMLDivElement>,
) => {
  const { isRotating } = props;

  return useMemo(() => {
    return isRotating ? (
      <div
        ref={ref}
        className="de-transform--angle-hint"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          color: "white",
          position: "absolute",
          left: "-100px",
          transform: "translate(-50%, -50%)",
          display: "inline-block",
          borderRadius: "4px",
          padding: "4px 6px",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        12
      </div>
    ) : null;
  }, [isRotating, ref]);
};

export const ShowCurrentAngleHint = forwardRef(InnerShowCurrentAngleHint);
