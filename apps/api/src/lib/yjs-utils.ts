import * as Y from 'yjs';
import * as sync from '@y/protocols/sync';
import * as awareness from '@y/protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

// This map stores the documents in memory while users are editing
const docs = new Map<string, Y.Doc>();

export const setupWSConnection = (conn: any, req: any) => {
  conn.binaryType = 'arraybuffer';
  
  // Extract document ID from the URL
  const docName = req.url?.split('/').pop() || 'default';
  
  // 1. Get or create the Yjs Document
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);
  }

  // 2. Send Initial Sync Step 1 (Tell the client what we have)
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // messageSync
  sync.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));

  // 3. Handle Incoming Messages
  conn.on('message', (message: ArrayBuffer) => {
    try {
      const encoder = encoding.createEncoder();
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readVarUint(decoder);
      
      if (messageType === 0) { // messageSync
        encoding.writeVarUint(encoder, 0);
        sync.readSyncMessage(decoder, encoder, doc, null);
        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder));
        }
      }
    } catch (err) {
      console.error('Yjs Sync Error:', err);
    }
  });

  // 4. Cleanup on disconnect
  conn.on('close', () => {
    // If no one is left in the room, you could optionally save to DB here
    // For now, we just let the connection drop
  });
};