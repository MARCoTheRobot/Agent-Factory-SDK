// Universal EventEmitter that works in both Node.js and browser environments

interface EventListener {
  (...args: any[]): void;
}

interface EventMap {
  [event: string]: EventListener[];
}

export class UniversalEventEmitter {
  private events: EventMap = {};

  /**
   * Add an event listener
   */
  on<T extends string>(event: T, listener: EventListener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Add a one-time event listener
   */
  once<T extends string>(event: T, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  off<T extends string>(event: T, listener: EventListener): this {
    if (!this.events[event]) {
      return this;
    }

    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }

    // Clean up empty arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }

    return this;
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   */
  removeAllListeners<T extends string>(event?: T): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Emit an event
   */
  emit<T extends string>(event: T, ...args: any[]): boolean {
    const listeners = this.events[event];
    if (!listeners || listeners.length === 0) {
      return false;
    }

    listeners.slice().forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });

    return true;
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount<T extends string>(event: T): number {
    return this.events[event]?.length || 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Get all listeners for an event
   */
  listeners<T extends string>(event: T): EventListener[] {
    return this.events[event]?.slice() || [];
  }
}
