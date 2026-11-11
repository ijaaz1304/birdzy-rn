type Unsubscribe = () => void;

/** One native subscription shared by mounted owners of the same side effect. */
export function createSharedAsyncSubscription<T>(
  connect: (onEvent: (event: T) => void) => Promise<Unsubscribe | null>
) {
  const owners = new Set<{ onEvent: (event: T) => void }>();
  let generation = 0;
  let connecting = false;
  let disconnect: Unsubscribe | null = null;

  return {
    subscribe(onEvent: (event: T) => void): Unsubscribe {
      const owner = { onEvent };
      owners.add(owner);
      if (!connecting && !disconnect) {
        connecting = true;
        const connection = ++generation;
        void connect((event) => {
          if (connection !== generation) return;
          // Multiple screens request the same registration side effect. Deliver it once.
          const latest = Array.from(owners).pop();
          latest?.onEvent(event);
        })
          .then((stop) => {
            if (connection !== generation) {
              stop?.();
              return;
            }
            connecting = false;
            disconnect = stop;
          })
          .catch((error) => {
            if (connection === generation) connecting = false;
            console.warn("[Subscription] Native listener setup failed", error);
          });
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        owners.delete(owner);
        if (owners.size) return;
        generation++;
        connecting = false;
        disconnect?.();
        disconnect = null;
      };
    },
  };
}
