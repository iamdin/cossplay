// Which tab the side panel edits. The panel belongs to one window; every load of a tab
// takes a lease, and async work must check lease.live() before any observable update.
export type Lease = { tabId: number; live: () => boolean };
export function createTarget() {
  let generation = 0, windowId: number | null = null, lease: Lease | null = null;
  return {
    setWindow(id: number) { windowId = id; },
    owns(id: number) { return id === windowId; },
    begin(tabId: number): Lease {
      const version = ++generation;
      return lease = { tabId, live: () => version === generation };
    },
    get lease() { return lease; },
  };
}
