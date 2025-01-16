import { Optional } from "@emrgen/types";

export interface Store {
  createSpace(spaceId?: string): Space;
  updateName(spaceId: string, name: string): void;
  getSpace(spaceId: string): Optional<Space>;
}

export interface Space {
  store: Store;
  id: string;
  name: string;
  // create child space
  createSpace(name: string): Space;
  // create document within the space
  createDocument(parentId: string, docId: string, content?: string): Document;
  // get document by name
  getDocument(docId: string): Optional<Document>;
  // get all children meta
  getChildrenMeta(parentId: string): { id: string; title: string }[];
}

export interface Document {
  space: Space;
  id: string;
  title: string;
  // get node by id from the document
  node(id: string): Optional<JSON>;
  // overwrite the document value
  update(title: string, content: string): void;
  // the document in json format
  json(): JSON;
}
