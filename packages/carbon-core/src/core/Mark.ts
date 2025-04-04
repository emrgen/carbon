import { each, isArray, isEmpty, isEqual, keys, sortBy, values } from "lodash";

export interface User {
  id: string;
  name: string;
}

export interface MarkProps {
  color?: string;
  href?: string;
  user?: User;
}

const propsKeys = ["color", "href", "user"];

function eqProps(a: MarkProps, b: MarkProps) {
  if (isEqual(a, b)) return true;
  return propsKeys.every(
    (key) => a[key] === b[key] || a[key] == "*" || b[key] == "*",
  );
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

  static link(href: string = "#"): Mark {
    return new Mark("link", { href });
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

  get isWild() {
    return this.props && propsKeys.some((key) => this.props?.[key] === "*");
  }

  eq(other: Mark) {
    return (
      this.name === other.name && eqProps(this.props || {}, other.props || {})
    );
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

  get(name: string) {
    return this.marks[name];
  }

  constructor(marks: Mark[] = []) {
    each(marks, (m) => this.add(m));
  }

  toArray() {
    return values(this.marks);
  }

  toggle(mark: Mark) {
    if (mark.isWild) {
      const similar = this.marks[mark.name];
      this.remove(similar);
      return this;
    }

    if (this.has(mark)) {
      const similar = this.marks[mark.name];
      if (similar && !similar.eq(mark)) {
        this.remove(similar);
        this.add(mark);
      } else {
        this.remove(mark);
      }
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

  hasSimilar(mark: Mark) {
    return !!this.marks[mark.name];
  }

  has(mark: Mark | Object): boolean {
    // FIXME: This is hack, we should not be comparing objects like this
    return values(this.marks)
      .map((m) => new Mark(m.name, m.props))
      .some((m) => {
        if (mark instanceof Mark) {
          return m.eq(mark);
        }

        const { name, props } = mark as any;
        return m.eq(new Mark(name, props));
      });
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

  static eq(marks1: Mark[], marks2: Mark[]) {
    return MarkSet.from(marks1).eq(MarkSet.from(marks2));
  }
}
