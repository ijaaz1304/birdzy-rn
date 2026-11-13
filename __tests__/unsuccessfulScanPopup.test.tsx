import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useUnsuccessfulScanPopup } from "../src/hooks/useUnsuccessfulScanPopup";
let mockScope = "backend:a";
const mockRead = jest.fn(async () => ({ remaining: 17, known: true }));
jest.mock("../src/services/session/scanQuota", () => ({
  scanQuota: { currentScope: () => mockScope },
  recordUnsuccessfulScan: () => mockRead(),
}));
const changed = jest.fn();
function Popup({
  visible = true,
  id = "attempt",
}: {
  visible?: boolean;
  id?: string;
}) {
  useUnsuccessfulScanPopup(visible, id, changed);
  return null;
}
let renderer: ReactTestRenderer;
beforeEach(() => {
  mockScope = "backend:a";
  jest.clearAllMocks();
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("displays returned usage without deducting on repeated popups", async () => {
  await act(async () => {
    renderer = create(<Popup />);
  });
  expect(changed).toHaveBeenLastCalledWith(17);
  await act(async () => {
    renderer.update(<Popup visible={false} />);
  });
  await act(async () => {
    renderer.update(<Popup />);
  });
  expect(changed).toHaveBeenLastCalledWith(17);
});
it("ignores an old popup after the account changes", async () => {
  await act(async () => {
    renderer = create(<Popup visible={false} />);
  });
  mockScope = "backend:b";
  await act(async () => {
    renderer.update(<Popup />);
  });
  expect(changed).not.toHaveBeenCalled();
});
