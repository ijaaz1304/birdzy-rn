import { useCallback, useEffect, useRef } from "react";

/** Let the previous native modal finish dismissing before opening its successor. */
export function useDeferredModalOpen(onOpen: () => void) {
  const callback = useRef(onOpen);
  callback.current = onOpen;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    []
  );
  return useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      callback.current();
    }, 350);
  }, []);
}
