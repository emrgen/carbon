import { each, isArray, isEmpty, isEqual, keys, sortBy, values } from "lodash";

export interface User {
  id: string;
  name: string;
}

export interface MarkProps {
  color?: string;
  url?: string;
  href?: string;
  user?: User;
}

export class Mark {
  // type is the name of the mark
  name: string;
  props?: MarkProps;

  static BOLD = Mark.create("bold");

  static ITALIC = Mark.create("italic");

  static UNDERLINE = Mark.create("underline");

  static STRIKE = Mark.create("strike");

  static CODE = Mark.create("code");

  static SUBSCRIPT = Mark.create("subscript");

  static SUPERSCRIPT = Mark.create("superscript");

  static HASHTAG = Mark.create("hashtag");

  static mention(): Mark {
    return new Mark("mention");
  }

  static link(url: string): Mark {
    return new Mark("link", { url });
  }

  static color(color: string): Mark {
    return new Mark("color", { color });
  }

  static background(color: string): Mark {
    return new Mark("background", { color });
  }

  static eqList(a: Mark[], b: Mark[]) {
    if (a.length !== b.length) return false;
    const as = sortBy(a, "type");
    const bs = sortBy(b, "type");
    return as.every((mark, i) => mark.eq(bs[i]));
  }

  static fromJSON(json: any) {
    const { name, props } = json;
    if (!name) throw new Error("Mark.fromJSON: missing name field in mark");

    return new Mark(name, props);
  }

  static create(name: string, props: MarkProps = {}) {
    return new Mark(name, props);
  }

  constructor(name: string, props: MarkProps = {}) {
    this.name = name;
    this.props = props;
  }

  eq(other: Mark) {
    return this.name === other.name && isEqual(this.props, other.props);
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toJSON() {
    const { name, props } = this;
    const ret: any = { name: name };
    if (!isEmpty(props)) {
      ret.props = props;
    }

    return ret;
  }

  clone() {
    return new Mark(this.name, { ...this.props });
  }
}

export class MarkSet {
  marks: Record<string, Mark> = {};

  get size() {
    return keys(this.marks).length;
  }

  static empty() {
    return new MarkSet([]);
  }

  static from(marks: Mark | Mark[] | MarkSet) {
    if (marks instanceof MarkSet) {
      return marks;
    }

    if (isArray(marks)) {
      return new MarkSet(marks);
    }

    return new MarkSet([marks]);
  }

  constructor(marks: Mark[] = []) {
    each(marks, (m) => this.add(m));
  }

  toArray() {
    return values(this.marks);
  }

  toggle(mark: Mark) {
    if (this.has(mark)) {
      this.remove(mark);
    } else {
      this.add(mark);
    }

    return this;
  }

  add(mark: Mark | Mark[]) {
    if (isArray(mark)) {
      each(mark, (m) => this.add(m));
    } else {
      this.marks[mark.name] = mark;
    }

    return this;
  }

  remove(mark: Mark) {
    delete this.marks[mark.name];
  }

  has(mark: Mark): boolean {
    return !!this.marks[mark.name];
  }

  map<A>(fn: (value: Mark, index: number, array: Mark[]) => A) {
    return values(this.marks).map(fn);
  }

  forEach(fn: (value: Mark, index: number, array: Mark[]) => void) {
    values(this.marks).forEach(fn);
  }

  eq(other: MarkSet) {
    if (this.size !== other.size) return false;
    const types = keys(this.marks);

    return types.every((k) => {
      const otherMark = other.marks[k];
      const thisMark = this.marks[k];
      return otherMark && thisMark && thisMark.eq(otherMark);
    });
  }

  freeze() {
    values(this.marks).forEach((m) => Object.freeze(m));
    return Object.freeze(this);
  }

  clone() {
    return MarkSet.from(this.map((m) => m.clone()));
  }

  toJSON() {
    return keys(this.marks);
  }

  toString() {
    return JSON.stringify(this.map((m) => m.toJSON()));
  }
}
