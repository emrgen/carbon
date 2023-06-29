export class PPath {
  constructor(readonly indices: number[]) {}
}

export class PPin {
  constructor(readonly path: PPath, readonly offset: number) {}
}

enum PPointAt {
  Before = 0,
  Within = 1,
  After = 2,
}

export class PPoint {
  constructor(readonly path: PPath, readonly at: PPointAt, readonly offset: number = -1) {}
}

export class PNodeContent {
  constructor(readonly nodes: PNode[], readonly text: string) {}

  children(): PNode[] {
    return this.nodes
  }

  textContent(): string {
    return this.text
  }
}

export class PNode {
  constructor(readonly id: string, readonly content: PNodeContent) {}

  fromJSON(json: any): PNode {
    if (json instanceof PNode) {
      return json
    }

    const {nodes = [], text} = json;
    const children = nodes.map(n => this.fromJSON(n));
    const content = new PNodeContent(children, text);
    return new PNode(json.id, content);
  }
}
