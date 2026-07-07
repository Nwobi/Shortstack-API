import { describe, it, expect } from "vitest";
import { LRUCache } from "../../src/cache/LRUCache";

describe("LRUCache", () => {
  it("stores and retrieves a value", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("returns undefined for missing keys", () => {
    const cache = new LRUCache<string, number>(3);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the least recently used entry when at capacity", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // access 'a' so 'b' becomes LRU
    cache.get("a");
    cache.set("d", 4); // should evict 'b'
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("updates an existing key without growing the cache", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("a", 99);
    expect(cache.get("a")).toBe(99);
    expect(cache.size).toBe(1);
  });

  it("deletes a key", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("respects capacity after deletions", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.delete("a");
    cache.set("c", 3); // should fit without evicting 'b'
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("clears all entries", () => {
    const cache = new LRUCache<string, number>(5);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("throws on capacity < 1", () => {
    expect(() => new LRUCache(0)).toThrow(RangeError);
  });
});
