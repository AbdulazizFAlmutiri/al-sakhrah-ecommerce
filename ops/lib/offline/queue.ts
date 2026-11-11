/** Durable outbox for the driver tablet: proofs (with photo) and location points survive no-signal and reloads. */
export type ProofPayload = {
  client_id: string; order_id: string; outcome: "delivered" | "failed"; reason_id: string | null; note: string | null;
  photo_path: string | null; lat: number | null; lng: number | null; accuracy: number | null; recorded_at: string;
};
export type LocationPayload = { client_id: string; lat: number; lng: number; accuracy: number | null; speed: number | null; recorded_at: string; refresh: boolean };
export type Item =
  | { id: string; kind: "proof"; payload: ProofPayload; photo: Blob | null; tries: number; createdAt: number }
  | { id: string; kind: "location"; payload: LocationPayload; tries: number; createdAt: number };

export interface Store {
  all(): Promise<Item[]>;
  put(item: Item): Promise<void>;
  remove(id: string): Promise<void>;
}

export type Senders = {
  uploadPhoto: (path: string, photo: Blob) => Promise<"ok" | "exists" | "error">;
  sendProof: (p: ProofPayload) => Promise<boolean>;
  sendLocation: (p: LocationPayload) => Promise<boolean>;
};

export class Outbox {
  private flushing: Promise<number> | null = null;
  constructor(private store: Store, private senders: Senders) {}

  async add(item: Item) { await this.store.put(item); }
  async pending(): Promise<Item[]> { return (await this.store.all()).sort((a, b) => a.createdAt - b.createdAt); }

  /** Send everything in creation order. Stops at the first proof failure (keeps order); skips failed locations. Returns items sent. */
  flush(): Promise<number> {
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      let sent = 0;
      for (const item of await this.pending()) {
        let ok = false;
        try {
          if (item.kind === "proof") {
            if (item.photo && item.payload.photo_path) {
              const up = await this.senders.uploadPhoto(item.payload.photo_path, item.photo);
              if (up === "error") { await this.bump(item); break; }
            }
            ok = await this.senders.sendProof(item.payload);
            if (!ok) { await this.bump(item); break; }
          } else {
            ok = await this.senders.sendLocation(item.payload);
            if (!ok) { await this.bump(item); continue; }
          }
        } catch {
          await this.bump(item);
          if (item.kind === "proof") break; else continue;
        }
        await this.store.remove(item.id);
        sent += 1;
      }
      return sent;
    })().finally(() => { this.flushing = null; });
    return this.flushing;
  }

  private async bump(item: Item) { await this.store.put({ ...item, tries: item.tries + 1 }); }
}

export class MemoryStore implements Store {
  private m = new Map<string, Item>();
  async all() { return [...this.m.values()]; }
  async put(i: Item) { this.m.set(i.id, i); }
  async remove(id: string) { this.m.delete(id); }
}

/** IndexedDB-backed store (browser / Android WebView). */
export class IdbStore implements Store {
  private db: Promise<IDBDatabase>;
  constructor(name = "sakhrah-outbox") {
    this.db = new Promise((res, rej) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("items", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db;
    return new Promise((res, rej) => {
      const req = fn(db.transaction("items", mode).objectStore("items"));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  all() { return this.tx<Item[]>("readonly", (s) => s.getAll() as IDBRequest<Item[]>); }
  async put(i: Item) { await this.tx("readwrite", (s) => s.put(i)); }
  async remove(id: string) { await this.tx("readwrite", (s) => s.delete(id)); }
}
