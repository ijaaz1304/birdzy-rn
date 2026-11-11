import { createSharedAsyncSubscription } from "../../src/utils/sharedAsyncSubscription";

it("connects once for overlapping owners and delivers a side effect once", async () => {
  let emit!: (event: string) => void;
  const stop = jest.fn();
  const connect = jest.fn(async (callback) => {
    emit = callback;
    return stop;
  });
  const listener = createSharedAsyncSubscription<string>(connect);
  const first = jest.fn();
  const second = jest.fn();
  const releaseFirst = listener.subscribe(first);
  const releaseSecond = listener.subscribe(second);
  await Promise.resolve();
  expect(connect).toHaveBeenCalledTimes(1);
  emit("token");
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  releaseSecond();
  emit("next");
  expect(first).toHaveBeenCalledTimes(1);
  expect(stop).not.toHaveBeenCalled();
  releaseFirst();
  releaseFirst();
  expect(stop).toHaveBeenCalledTimes(1);
});
it("disposes a connection that resolves after unmount without closing its replacement", async () => {
  const finishes: Array<(stop: () => void) => void> = [];
  const events: Array<(event: string) => void> = [];
  const listener = createSharedAsyncSubscription<string>((emit) => {
    events.push(emit);
    return new Promise((resolve) => {
      finishes.push(resolve);
    });
  });
  const oldHandler = jest.fn();
  const currentHandler = jest.fn();
  listener.subscribe(oldHandler)();
  const releaseCurrent = listener.subscribe(currentHandler);
  const oldStop = jest.fn();
  const currentStop = jest.fn();
  finishes[0](oldStop);
  finishes[1](currentStop);
  await Promise.resolve();
  expect(oldStop).toHaveBeenCalledTimes(1);
  events[0]("stale");
  events[1]("current");
  expect(oldHandler).not.toHaveBeenCalled();
  expect(currentHandler).toHaveBeenCalledTimes(1);
  expect(currentStop).not.toHaveBeenCalled();
  releaseCurrent();
  expect(currentStop).toHaveBeenCalledTimes(1);
});
it("retries setup after an unavailable module", async () => {
  const stop = jest.fn();
  const connect = jest
    .fn()
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(stop);
  const listener = createSharedAsyncSubscription(connect);
  const first = listener.subscribe(jest.fn());
  await Promise.resolve();
  const second = listener.subscribe(jest.fn());
  await Promise.resolve();
  expect(connect).toHaveBeenCalledTimes(2);
  first();
  second();
  expect(stop).toHaveBeenCalledTimes(1);
});
