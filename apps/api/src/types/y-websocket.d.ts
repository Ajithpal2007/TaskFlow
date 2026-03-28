declare module 'y-websocket/bin/utils' {
  import { Doc } from 'yjs';
  export class WSSharedDoc extends Doc {
    name: string;
    conns: Map<any, Set<number>>;
    awareness: any;
    constructor(name: string);
  }
}

declare module '@y/protocols/sync';
declare module '@y/protocols/awareness';
declare module 'lib0/encoding';
declare module 'lib0/decoding';