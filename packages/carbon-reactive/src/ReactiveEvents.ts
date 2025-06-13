export class ReactiveEvents {
  static pending(id: string): string {
    return `pending:${id}`;
  }

  static processing(id: string): string {
    return `processing:${id}`;
  }

  static fulfilled(id: string): string {
    return `fulfilled:${id}`;
  }

  static rejected(id: string): string {
    return `rejected:${id}`;
  }

}
