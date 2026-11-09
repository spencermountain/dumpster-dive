// simple linked list queue abstraction
// to avoid using array.shift()
class Queue {
  constructor() {
    this.first = null // oldest item, removed next
    this.latest = null // newest item, only set when there are two or more
    this.length = 0
  }

  add(item) {
    const node = { item, next: null }
    this.length += 1
    // is this our first item?
    if (this.first === null) {
      this.first = node
      return
    }
    // is this our second item?
    if (this.latest === null) {
      this.first.next = node
      this.latest = node
      return
    }
    // add remaining items to the tail
    this.latest.next = node
    this.latest = node
  }

  get() {
    if (this.first === null) {
      return undefined
    }
    // get oldest item
    const node = this.first
    this.first = node.next // shift next item
    this.length -= 1
    // a single remaining item is represented by first alone
    if (this.first === null || this.first.next === null) {
      this.latest = null
    }
    return node.item
  }
}

export default Queue
