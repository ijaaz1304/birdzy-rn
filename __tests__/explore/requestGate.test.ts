import {
  createRequestGate,
  retryAfterMs,
  waitForRequest,
} from "@/features/explore/utils/abortableRequest";
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("parses Retry-After seconds and HTTP dates", () => {
  expect(retryAfterMs("2")).toBe(2000);
  expect(
    retryAfterMs(
      "Tue, 27 Oct 2026 10:00:02 GMT",
      Date.parse("2026-10-27T10:00:00Z")
    )
  ).toBe(2000);
  expect(retryAfterMs("invalid")).toBeNull();
  expect(retryAfterMs("-1")).toBeNull();
});
test("canceled delays settle immediately", async () => {
  const controller = new AbortController();
  const request = waitForRequest(5000, controller.signal);
  const assertion = expect(request).rejects.toMatchObject({
    name: "AbortError",
  });
  controller.abort();
  await assertion;
});
test("starts paced reads and cancels obsolete queued requests", async () => {
  const gate = createRequestGate(500);
  const run = jest.fn(async () => true);
  await gate(run);
  const controller = new AbortController();
  const second = gate(run, controller.signal);
  const assertion = expect(second).rejects.toMatchObject({
    name: "AbortError",
  });
  controller.abort();
  await assertion;
  const third = gate(run);
  await jest.advanceTimersByTimeAsync(500);
  await third;
  expect(run).toHaveBeenCalledTimes(2);
});
test("honors Retry-After once and does not retry indefinitely", async () => {
  const gate = createRequestGate();
  const busy = { response: { status: 429, headers: { "retry-after": "2" } } };
  const run = jest.fn().mockRejectedValueOnce(busy).mockResolvedValueOnce("ok");
  const request = gate(run);
  await jest.advanceTimersByTimeAsync(1999);
  expect(run).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  expect(await request).toBe("ok");
  const fail = jest.fn().mockRejectedValue(busy);
  const failure = gate(fail);
  const assertion = expect(failure).rejects.toBe(busy);
  await jest.advanceTimersByTimeAsync(4000);
  await assertion;
  expect(fail).toHaveBeenCalledTimes(2);
});
test("long cooldown is surfaced and subsequent reads never hit the server", async () => {
  const gate = createRequestGate();
  const busy = { response: { status: 429, headers: { "retry-after": "60" } } };
  await expect(
    gate(async () => {
      throw busy;
    })
  ).rejects.toBe(busy);
  const controller = new AbortController();
  const run = jest.fn();
  const request = gate(run, controller.signal);
  const assertion = expect(request).rejects.toThrow("Too many requests");
  controller.abort();
  await assertion;
  expect(run).not.toHaveBeenCalled();
});

test("retries normalized Axios rate limits using preserved Retry-After", async () => {
  const { AxiosError } = require("axios");
  const { normalizeError } = require("../../src/services/api/errors");
  const raw = new AxiosError("Busy", "ERR_BAD_RESPONSE", undefined, undefined, {
    status: 429,
    data: {},
    headers: { "retry-after": "2" },
  });
  const normalized = normalizeError(raw);
  expect(normalized).toMatchObject({ status: 429, retryAfter: "2" });
  const gate = createRequestGate();
  const run = jest
    .fn()
    .mockRejectedValueOnce(normalized)
    .mockResolvedValueOnce("ok");
  const request = gate(run);
  await jest.advanceTimersByTimeAsync(1999);
  expect(run).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  expect(await request).toBe("ok");
});
