import React from "react";

export type ReactEvent = React.MouseEvent | React.KeyboardEvent | React.ChangeEvent<any>

export const stopEvent = (e: ReactEvent) => {
  e.stopPropagation();
}

export const preventEvent = (e: ReactEvent) => {
  e.preventDefault();
}

export const stopPreventEvent = (e: ReactEvent) => {
  e.stopPropagation();
  e.preventDefault();
}