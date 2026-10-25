import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useDeferredModalOpen } from "../src/hooks/useDeferredModalOpen";

let renderer: ReactTestRenderer;
let schedule: () => void;
function Harness({ onOpen }: { onOpen: () => void }) {
  schedule = useDeferredModalOpen(onOpen);
  return null;
}
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => renderer?.unmount());
  jest.useRealTimers();
});
it("waits for the previous sheet to dismiss before presenting its successor", async () => {
  const open = jest.fn();
  await act(async () => {
    renderer = create(<Harness onOpen={open} />);
  });
  await act(async () => {
    schedule();
    jest.advanceTimersByTime(349);
  });
  expect(open).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(open).toHaveBeenCalledTimes(1);
});
it("deduplicates repeated selections and uses the latest callback", async () => {
  const oldOpen = jest.fn();
  const open = jest.fn();
  await act(async () => {
    renderer = create(<Harness onOpen={oldOpen} />);
  });
  await act(async () => {
    schedule();
    schedule();
  });
  await act(async () => {
    renderer.update(<Harness onOpen={open} />);
  });
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
  expect(oldOpen).not.toHaveBeenCalled();
  expect(open).toHaveBeenCalledTimes(1);
});
it("does not open a sheet after leaving its owner screen", async () => {
  const open = jest.fn();
  await act(async () => {
    renderer = create(<Harness onOpen={open} />);
  });
  await act(async () => {
    schedule();
    renderer.unmount();
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(open).not.toHaveBeenCalled();
});
