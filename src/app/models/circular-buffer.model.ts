/**
 * CircularBuffer is a generic data structure designed to maintain
 * a fixed-size, first-in-first-out (FIFO) collection of elements.
 * When the buffer is full, and a subsequent element is added,
 * then the oldest element in the buffer is overwritten.
 */
export class CircularBuffer<T> {
  // Maximum number of items in the buffer
  private capacity: number;

  // An array that holds the items
  private buffer: Array<T | null>;

  // Current number of items in the buffer
  private size: number;

  // Points to the oldest item in the buffer
  private start: number;

  /**
   * Initializes a new instance of CircularBuffer with a specified capacity.
   * @param capacity - The maximum number of items the buffer can hold.
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T | null>(capacity).fill(
      null
    ) as unknown as Array<T | null>;
    this.size = 0;
    this.start = 0;
  }

  /**
   * Adds an item to the buffer.
   * If the buffer is full, it overwrites the oldest item.
   * @param item - The item to add to the buffer.
   */
  push(item: T): void {
    let index = (this.start + this.size) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    } else {
      // If the buffer is full, increment the start index to "overwrite" the oldest item
      this.start = (this.start + 1) % this.capacity;
    }

    this.buffer[index] = item;
  }

  /**
   * Retrieves an item from the buffer by its index.
   * @param index - The zero-based index of the item to retrieve.
   * @returns The item at the specified index.
   * @throws An error if the index is out of bounds.
   */
  get(index: number): T | null {
    if (index < 0 || index >= this.size) {
      throw new Error('Index out of bounds');
    }
    return this.buffer[(this.start + index) % this.capacity];
  }

  /**
   * Returns the current buffer as an array, from the oldest to the newest.
   * @returns An array containing all items in the buffer.
   */
  toArray(): Array<T | null> {
    const result: Array<T | null> = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.get(i));
    }
    return result;
  }

  /**
   * Gets the current number of items in the buffer.
   * @returns The number of items currently in the buffer.
   */
  getLength(): number {
    return this.size;
  }
}
