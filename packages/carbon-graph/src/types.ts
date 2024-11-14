import { IPoint } from "@emrgen/carbon-affine";

export interface Position extends IPoint{}

export interface Size {
  width: number;
  height: number;
}

export interface EdgePart {
  points: IPoint[];
}


export interface EdgeData {
  name: string;
  source: {
    node: string;
    position: Position;
  };
  target: {
    node: string;
    position: Position;
  };
  parts: EdgePart[];
}

export interface NodeData {
  name: string;
  position: Position;
  size: Size;
}
