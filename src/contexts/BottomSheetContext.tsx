/**
 * Dynamic Bottom Sheet Context
 * Single place to open/close bottom sheets. One sheet visible at a time.
 * Register sheet types in bottomSheetRegistry.ts – keeps all sheets easy to track.
 * Background zoom fix: sheets use resizeMode "contain" / preserveAspectRatio "meet" by default.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  ComponentType,
} from "react";

export type SheetId = string;

export type SheetProps = Record<string, unknown> & {
  onClose?: () => void;
};

type SheetRegistry = Record<
  SheetId,
  ComponentType<{
    visible: boolean;
    onClose: () => void;
    [key: string]: unknown;
  }>
>;

type BottomSheetContextValue = {
  openSheet: (id: SheetId, props?: SheetProps) => void;
  closeSheet: () => void;
  isOpen: boolean;
  currentSheetId: SheetId | null;
};

const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(
  undefined
);

export interface BottomSheetProviderProps {
  children: ReactNode;
  /** Map of sheet id → component. Use getDefaultSheetRegistry() or pass custom. */
  registry: SheetRegistry;
}

export const BottomSheetProvider: React.FC<BottomSheetProviderProps> = ({
  children,
  registry,
}) => {
  const [current, setCurrent] = useState<{
    id: SheetId;
    props: SheetProps;
  } | null>(null);

  const closeSheet = useCallback(() => {
    if (
      current?.props?.onClose &&
      typeof current.props.onClose === "function"
    ) {
      (current.props.onClose as () => void)();
    }
    setCurrent(null);
  }, [current?.props?.onClose]);

  const openSheet = useCallback(
    (id: SheetId, props: SheetProps = {}) => {
      if (!registry[id]) {
        if (__DEV__) {
          console.warn(`[BottomSheet] No sheet registered for id: "${id}"`);
        }
        return;
      }
      setCurrent({ id, props });
    },
    [registry]
  );

  const value: BottomSheetContextValue = {
    openSheet,
    closeSheet,
    isOpen: current !== null,
    currentSheetId: current?.id ?? null,
  };

  const SheetComponent = current ? registry[current.id] : null;

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      {SheetComponent && current && (
        <SheetComponent visible onClose={closeSheet} {...current.props} />
      )}
    </BottomSheetContext.Provider>
  );
};

export function useBottomSheet(): BottomSheetContextValue {
  const ctx = useContext(BottomSheetContext);
  if (ctx === undefined) {
    throw new Error(
      "useBottomSheet must be used within a BottomSheetProvider. Add BottomSheetProvider with a registry (e.g. getDefaultSheetRegistry()) near the root of your app."
    );
  }
  return ctx;
}

/** Optional: use when provider is not in tree (e.g. optional migration). Returns no-op openSheet/closeSheet and isOpen: false. */
export function useBottomSheetOptional(): BottomSheetContextValue {
  const ctx = useContext(BottomSheetContext);
  if (ctx === undefined) {
    return {
      openSheet: () => {},
      closeSheet: () => {},
      isOpen: false,
      currentSheetId: null,
    };
  }
  return ctx;
}
