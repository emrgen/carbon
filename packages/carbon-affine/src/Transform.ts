import { Affine } from './Affine'

// This class is a wrapper around Affine that allows you to chain transformations.
// all transformation are of form: scale -> rotate -> translate
export class Transform {
  mats: Affine[] = []

  constructor() {
    this.mats.push(new Affine([1, 0, 0, 0, 1, 0]))
  }

  translate(x: number, y: number) {
    this.mats.push(this.mats[this.mats.length - 1].translate(x, y))
  }

  rotate(angle: number, cx?: number, cy?: number) {
    if (cx === undefined || cy === undefined) {
      this.mats.push(this.mats[this.mats.length - 1].rotate(angle))
    } else {
      this.mats.push(this.mats[this.mats.length - 1].translate(cx, cy).rotate(angle).translate(-cx, -cy))
    }
  }

  scale(x: number, y: number, cx?: number, cy?: number) {
    if (cx === undefined || cy === undefined) {
      this.mats.push(this.mats[this.mats.length - 1].scale(x, y))
    } else {
      this.mats.push(this.mats[this.mats.length - 1].translate(cx, cy).scale(x, y).translate(-cx, -cy))
    }
  }

}
