/**
 * A fixed-capacity Least Recently Used cache implemented with a doubly-linked
 * list + Map, giving O(1) get and set. Used to front the database for hot
 * short-code → original_url lookups so the redirect path (the critical hot
 * path) doesn't hit SQLite on every request.
 */

interface Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
}

export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, Node<K, V>>;
  // Sentinel head/tail nodes simplify edge-case handling
  private readonly head: Node<K, V>;
  private readonly tail: Node<K, V>;

  constructor(capacity: number) {
    if (capacity < 1)
      throw new RangeError("LRUCache capacity must be at least 1");
    this.capacity = capacity;
    this.map = new Map();

    this.head = {
      key: null as unknown as K,
      value: null as unknown as V,
      prev: null,
      next: null,
    };
    this.tail = {
      key: null as unknown as K,
      value: null as unknown as V,
      prev: null,
      next: null,
    };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    const node: Node<K, V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.insertAtFront(node);
    if (this.map.size > this.capacity) this.evictLRU();
  }

  delete(key: K): void {
    const node = this.map.get(key);
    if (!node) return;
    this.removeNode(node);
    this.map.delete(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private insertAtFront(node: Node<K, V>) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: Node<K, V>) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToFront(node: Node<K, V>) {
    this.removeNode(node);
    this.insertAtFront(node);
  }

  private evictLRU() {
    const lru = this.tail.prev!;
    this.removeNode(lru);
    this.map.delete(lru.key);
  }
}
