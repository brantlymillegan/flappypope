// Shuffle a full collection before repeating it, including across cycle boundaries.
export class ShuffleBag {
  constructor(items, random = Math.random) {
    if (!items.length) throw new Error('A rotation needs at least one item.');
    this.items = [...items]; this.random = random; this.queue = []; this.previous = null;
  }
  next() {
    if (!this.queue.length) {
      this.queue = [...this.items];
      for (let i = this.queue.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
      const end = this.queue.length - 1;
      if (end > 0 && this.queue[end] === this.previous) [this.queue[0], this.queue[end]] = [this.queue[end], this.queue[0]];
    }
    return this.previous = this.queue.pop();
  }
}
