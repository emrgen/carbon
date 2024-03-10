class DomNode {
  children: DomNode[] = [];

  constructor(readonly el: Element) {
    for (let i = 0; i < el.children.length; i++) {
      this.children.push(new DomNode(el.children[i] as Element));
    }
  }

  get name() {
    return this.el.tagName.toLowerCase();
  }

  get textContent() {
    return this.el.textContent;
  }

  get innerHTML() {
    return this.el.innerHTML;
  }
}


export const parseDom = (els: Element[]) => {
  return els.map(el => new DomNode(el));
}
