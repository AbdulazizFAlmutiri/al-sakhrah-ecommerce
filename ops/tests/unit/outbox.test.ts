import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { IdbStore, MemoryStore, Outbox, type Item } from "@/lib/offline/queue";

const proof = (id: string, t: number, photo = true): Item => ({
  id, kind: "proof", tries: 0, createdAt: t, photo: photo ? new Blob(["x"]) : null,
  payload: { client_id: id, order_id: "o" + id, outcome: "delivered", reason_id: null, note: null, photo_path: photo ? `u/${id}.jpg` : null, lat: 1, lng: 2, accuracy: 5, recorded_at: "2026-11-11T08:00:00Z" },
});
const loc = (id: string, t: number): Item => ({ id, kind: "location", tries: 0, createdAt: t, payload: { client_id: id, lat: 1, lng: 2, accuracy: null, speed: null, recorded_at: "x", refresh: false } });

describe("Outbox", () => {
  it("sends in creation order and empties the queue", async () => {
    const order: string[] = [];
    const ob = new Outbox(new MemoryStore(), {
      uploadPhoto: async (p) => { order.push("up:" + p); return "ok"; },
      sendProof: async (p) => { order.push("proof:" + p.client_id); return true; },
      sendLocation: async (p) => { order.push("loc:" + p.client_id); return true; },
    });
    await ob.add(proof("b", 2)); await ob.add(loc("a", 1)); await ob.add(proof("c", 3, false));
    expect(await ob.flush()).toBe(3);
    expect(order).toEqual(["loc:a", "up:u/b.jpg", "proof:b", "proof:c"]);
    expect(await ob.pending()).toHaveLength(0);
  });
  it("treats an already-uploaded photo as success (replay after a crash)", async () => {
    const sendProof = vi.fn(async () => true);
    const ob = new Outbox(new MemoryStore(), { uploadPhoto: async () => "exists", sendProof, sendLocation: async () => true });
    await ob.add(proof("p", 1));
    expect(await ob.flush()).toBe(1);
    expect(sendProof).toHaveBeenCalledOnce();
  });
  it("stops at a failing proof to keep order, keeps it with a retry count, and skips failing locations", async () => {
    const ob = new Outbox(new MemoryStore(), {
      uploadPhoto: async () => "ok",
      sendProof: async (p) => p.client_id !== "bad",
      sendLocation: async (p) => p.client_id !== "lbad",
    });
    await ob.add(loc("lbad", 1)); await ob.add(proof("bad", 2)); await ob.add(proof("later", 3));
    expect(await ob.flush()).toBe(0);
    const left = await ob.pending();
    expect(left.map((i) => [i.id, i.tries])).toEqual([["lbad", 1], ["bad", 1], ["later", 0]]);
  });
  it("survives network exceptions", async () => {
    const ob = new Outbox(new MemoryStore(), { uploadPhoto: async () => { throw new Error("offline"); }, sendProof: async () => true, sendLocation: async () => true });
    await ob.add(proof("x", 1));
    expect(await ob.flush()).toBe(0);
    expect((await ob.pending())[0].tries).toBe(1);
  });
  it("persists items (with photos) in IndexedDB", async () => {
    const s = new IdbStore("test-db");
    await s.put(proof("i", 1));
    const all = await s.all();
    expect(all).toHaveLength(1);
    expect(all[0].kind).toBe("proof");
    await s.remove("i");
    expect(await s.all()).toHaveLength(0);
  });
});
