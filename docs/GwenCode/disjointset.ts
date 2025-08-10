/**
 * Implements the Disjoint-set datastructure, which is useful for
 * representing Cint (set of sets of interchangeable controllers).
 *
 * See https://en.wikipedia.org/wiki/Disjoint-set_data_structure
 */
export class DisjointSet<T> {
  private parents = new Map<T, T>();
  private items = new Set<T>();
  constructor() {
  }

  /** Is the given item in any of the sets in this data structure? */
  has(item: T): boolean {
    return this.items.has(item);
  }

  /**
   * Adds the given item to this datastructure (no-op if it already was added).
   *
   * If the item was not already present, it will implicitly begin as the root
   * element of a set of which it is the sole member.
   */
  add(item: T) {
    this.items.add(item);
  }

  /**
   * Merge the set which contains element A with the set which contains element B.
   *
   * If the two items are already in the same set, this is a no-op. If either or both
   * A and B were not already in this datastructure, they will be added.
   *
   * @returns The root item of the new combined set.
   */
  merge(a: T, b: T): T {
    this.items.add(a);
    this.items.add(b);
    let rootA = this.find(a);
    let rootB = this.find(b);
    this.parents.set(rootB, rootA);
    return rootA;
  }

  /**
   * Finds the set which the given item is in.
   *
   * Note that if the item has never been added to this datastructure,
   * this method will simply return the input item.
   *
   * @returns The root element of the set which the input item is in.
   */
  find(item: T): T {
    const seen = new Set<T>();
    let x = item;
    while (this.parents.has(x) && !seen.has(x)) {
      seen.add(x);
      x = this.parents.get(x);
    }
    // path compression optimization
    seen.forEach((node: T) => {
      if (node !== x) {
        this.parents.set(node, x);
      }
    });
    return x;
  }

  /** The root elements of all disjoints sets this datastructure represents. */
  roots(): Set<T> {
    const roots = new Set<T>();
    this.items.forEach((item: T) => {
      if (!this.parents.has(item)) {
        roots.add(item);
      }
    });
    return roots;
  }
}

