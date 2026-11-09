// Manual pause switch for async code.
// Code that calls `await gate.wait()` continues immediately while the gate is
// open, and is suspended indefinitely while the gate is paused
 class AsyncGate {
  constructor() {
    this.isPaused = false // true while the gate is closed
    this.stall = null // the promise waiting code is parked on (only while paused)
    this.resolver = null // resolving this promise wakes everything parked on `blocker`
  }

  // Close the gate. Anyone who calls wait() from now on will be suspended.
  pause() {
    if (this.isPaused) {
      return
    } // already paused: don't replace the blocker, or earlier waiters would be orphaned
    this.isPaused = true
    // stash resolve() so resume() can call it later
    this.stall = new Promise((resolve) => {
      this.resolver = resolve
    })
  }

  // Open the gate and wake everyone waiting on it.
  resume() {
    if (!this.isPaused) {
      return
    }
    const resolver = this.resolver
    this.isPaused = false
    this.stall = null
    this.resolver = null
    resolver() // resolves the blocker promise
  }

  // Returns a promise to await.
  // - paused: the pending blocker promise, so `await` suspends until resume()
  // - open:   an already-resolved promise, so `await` continues almost immediately
  wait() {
    if (this.isPaused) {
      return this.stall
    }
    return Promise.resolve()
  }
}

export default function () {
  return new AsyncGate()
}
