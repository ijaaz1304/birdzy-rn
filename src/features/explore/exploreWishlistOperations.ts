/** Pending mutations outlive individual recycled cards, but never their account/session. */
type Operation = { next: boolean; token: symbol };
const operations = new Map<string, Operation>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const exploreWishlistOperations = {
  key: (account: string | undefined, session: number, id: string) =>
    JSON.stringify([account ?? null, session, id]),
  get: (key: string) => operations.get(key),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  begin(key: string, next: boolean): symbol | null {
    if (operations.has(key)) return null;
    const token = Symbol();
    operations.set(key, { next, token });
    notify();
    return token;
  },
  finish(key: string, token: symbol) {
    if (operations.get(key)?.token !== token) return;
    operations.delete(key);
    notify();
  },
  retainOwner(account: string | undefined, session: number) {
    let changed = false;
    for (const key of operations.keys()) {
      const [owner, version] = JSON.parse(key);
      if (owner !== (account ?? null) || version !== session) {
        operations.delete(key);
        changed = true;
      }
    }
    if (changed) notify();
  },
};
