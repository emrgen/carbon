import { Optional } from "@emrgen/types";
import { v4 as uuidv4 } from "uuid";
import { Document, Space, Store } from "./Store";

const STORE_KEY = "carbon-store";
const SPACE_KEY = "carbon-space";
const DOC_KEY = "carbon-doc";

const getSpaceKey = (spaceId: string) => `${SPACE_KEY}:${spaceId}`;
const getDocKey = (spaceId: string, docId: string) =>
  `${SPACE_KEY}:${spaceId}/${DOC_KEY}:${docId}`;

export class LocalStore implements Store {
  createSpace(spaceId?: string): Space {
    const space = new LocalSpace(this, spaceId || uuidv4(), "Untitled");

    // Save the space
    const spaces = this.getSpaces();
    spaces[space.id] = { id: space.id, name: space.name };
    this.saveSpaces(spaces);

    return space;
  }

  private getSpaces(): Record<string, ISpace> {
    const spaces = localStorage.getItem(STORE_KEY);
    return spaces ? JSON.parse(spaces) : [];
  }

  private saveSpaces(spaces: Record<string, ISpace>) {
    localStorage.setItem(STORE_KEY, JSON.stringify(spaces));
  }

  updateName(spaceId: string, name: string): void {
    const spaces = this.getSpaces();
    spaces[spaceId].name = name;
    this.saveSpaces(spaces);
  }

  getSpace(spaceId: string): Optional<Space> {
    const spaces = this.getSpaces();
    const space = spaces[spaceId];
    return space ? new LocalSpace(this, space.id, space.name) : null;
  }
}

interface ISpace {
  id: string;
  name: string;
}

export class LocalSpace implements Space {
  id: string;
  name: string;
  store: Store;

  constructor(store: Store, spaceId: string, name: string) {
    this.store = store;
    this.id = spaceId;
    this.name = spaceId;
  }

  createSpace(name: string): Space {
    throw new Error("Method not implemented.");
  }

  createDocument(docId?: string, content?: string): Document {
    const doc = new LocalDoc(this, docId || uuidv4(), "Untitled");

    // Save the doc
    const docs = this.getDocuments();
    docs[doc.id] = {
      id: doc.id,
      spaceId: this.id,
      title: doc.title,
      content: content ?? "{}",
    };
    this.saveDocuments(docs);

    return doc;
  }

  private getDocuments(): Record<string, ILocalDoc> {
    const docs = localStorage.getItem(getSpaceKey(this.id));
    return docs ? JSON.parse(docs) : [];
  }

  private saveDocuments(docs: Record<string, ILocalDoc>) {
    localStorage.setItem(getSpaceKey(this.id), JSON.stringify(docs));
  }

  getDocument(docId: string): Optional<Document> {
    const docs = this.getDocuments();
    const doc = docs[docId];

    return doc ? new LocalDoc(this, doc.id, doc.title) : null;
  }
}

interface ILocalDoc {
  spaceId: string;
  id: string;
  title: string;
  content: string;
}

export class LocalDoc implements Document {
  space: Space;
  id: string;
  title: string;

  constructor(space: Space, id: string, title: string) {
    this.space = space;
    this.id = id;
    this.title = title;
  }

  json(): JSON {
    const doc = this.getDocument();
    return doc?.content ? doc.content : JSON.parse("{}");
  }

  update(title: string, content: string): void {
    this.setDocument({
      id: this.id,
      spaceId: this.space.id,
      title,
      content,
    });
  }

  private getDocument(): Optional<ILocalDoc> {
    const doc = localStorage.getItem(getDocKey(this.space.id, this.id));
    return doc ? JSON.parse(doc) : null;
  }

  private setDocument(doc: ILocalDoc) {
    localStorage.setItem(
      getDocKey(this.space.id, this.id),
      JSON.stringify(doc),
    );
  }

  node(id: string): Optional<JSON> {
    throw new Error("Method not implemented.");
  }
}