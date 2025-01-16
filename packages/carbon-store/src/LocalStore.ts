import { Optional } from "@emrgen/types";
import { v4 as uuidv4 } from "uuid";
import { Document, Space, Store } from "./Store";

const STORE_KEY = "carbon-store";
const SPACE_KEY = "carbon-space";
const DOC_KEY = "carbon-doc";
const SPACE_CONTENT_KEY = "carbon-space-content";
const DOC_META_KEY = "carbon-doc-meta";

const getSpaceKey = (spaceId: string) => `${SPACE_KEY}:${spaceId}`;
const getDocMetaKey = (docId: string) => `${DOC_KEY}:${docId}/${DOC_META_KEY}`;
const getDocKey = (spaceId: string, docId: string) =>
  `${SPACE_KEY}:${spaceId}/${DOC_KEY}:${docId}`;
const getSpaceContentKey = (spaceId: string) =>
  `${SPACE_KEY}:${spaceId}/${SPACE_CONTENT_KEY}`;

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

  // create a child space
  createSpace(name: string): Space {
    throw new Error("Method not implemented.");
  }

  createDocument(parentId: string, docId: string, content?: string): Document {
    const doc = new LocalDoc(this, parentId, docId || uuidv4(), "Untitled");

    // save the doc
    const docs = this.getDocuments();
    docs[doc.id] = {
      parentId: doc.parentId,
      id: doc.id,
      spaceId: this.id,
      title: doc.title,
      content: content ?? "{}",
    };
    this.saveDocuments(docs);

    // update the space content
    const spaceContent = this.getSpaceContent();
    if (!spaceContent[parentId]) {
      spaceContent[parentId] = [];
    }

    spaceContent[parentId].push(doc.id);
    this.saveSpaceContentLocal(spaceContent);

    this.saveDocumentMeta(doc.id, { id: doc.id, title: doc.title });

    return doc;
  }

  private getDocuments(): Record<string, ILocalDoc> {
    const docs = localStorage.getItem(getSpaceKey(this.id));
    return docs ? JSON.parse(docs) : [];
  }

  private saveDocuments(docs: Record<string, ILocalDoc>) {
    localStorage.setItem(getSpaceKey(this.id), JSON.stringify(docs));
  }

  private getSpaceContent(): JSON {
    return this.getSpaceContentLocal();
  }

  getChildrenMeta(parentId: string): { id: string; title: string }[] {
    const docs = this.getSpaceContentLocal();
    const children = docs[parentId] || [];
    return children.map((childId) => {
      const doc = this.getDocumentMeta(childId);
      return { id: doc.id, title: doc.title };
    });
  }

  private getDocumentMeta(docId: string): { id: string; title: string } {
    const doc = localStorage.getItem(getDocMetaKey(docId));
    return doc ? JSON.parse(doc) : { id: docId, title: "Untitled" };
  }

  private saveDocumentMeta(docId: string, meta: { id: string; title: string }) {
    localStorage.setItem(getDocMetaKey(docId), JSON.stringify(meta));
  }

  private getSpaceContentLocal(): JSON {
    return JSON.parse(
      localStorage.getItem(getSpaceContentKey(this.id)) || "{}",
    );
  }

  private saveSpaceContentLocal(content: JSON) {
    localStorage.setItem(getSpaceContentKey(this.id), JSON.stringify(content));
  }

  getDocument(docId: string): Optional<Document> {
    const docs = this.getDocuments();
    const doc = docs[docId];

    return doc ? new LocalDoc(this, doc.parentId, doc.id, doc.title) : null;
  }
}

interface ILocalDoc {
  spaceId: string;
  parentId: string;
  id: string;
  title: string;
  content: string;
}

export class LocalDoc implements Document {
  space: Space;
  id: string;
  parentId: string;
  title: string;

  constructor(space: Space, parentId: string, id: string, title: string) {
    this.space = space;
    this.parentId = parentId;
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
      parentId: this.parentId,
      spaceId: this.space.id,
      title,
      content,
    });

    localStorage.setItem(
      getDocMetaKey(this.id),
      JSON.stringify({ id: this.id, title }),
    );
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
