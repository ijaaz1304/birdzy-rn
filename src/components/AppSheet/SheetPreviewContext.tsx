/** Settings previews render real sheets with local fixtures and no external actions. */
import { createContext, useContext } from "react";

const SheetPreviewContext = createContext(false);
export const SheetPreviewProvider = SheetPreviewContext.Provider;
export const useSheetPreview = () => useContext(SheetPreviewContext);

export const PREVIEW_COLLECTIONS = [
  { collectionId: "preview-garden", name: "Garden birds", specimenCount: 3 },
  { collectionId: "preview-trips", name: "Birding trips", specimenCount: 8 },
];
