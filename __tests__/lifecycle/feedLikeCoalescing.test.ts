jest.mock("../../src/lib/firebase", () => ({
  isFirebaseInitialized: () => true,
}));
jest.mock("../../src/services/analytics/analytics.service", () => ({
  analyticsService: { logEvent: jest.fn() },
  EVENTS: {},
}));
import { feedService } from "../../src/services/firebase/feed.service";

afterEach(() => jest.restoreAllMocks());
it("shares overlapping likes and sends one owner notification, then permits a later unlike", async () => {
  let finish!: (document: unknown) => void;
  const get = jest.fn().mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const update = jest.fn(async () => {});
  const postRef = { get, update };
  jest
    .spyOn(feedService as any, "getFirestore")
    .mockReturnValue({ collection: () => ({ doc: () => postRef }) });
  jest
    .spyOn(feedService as any, "getFieldValue")
    .mockReturnValue({
      arrayUnion: (id: string) => [id],
      arrayRemove: () => [],
    });
  const notify = jest
    .spyOn(feedService as any, "writeFeedNotification")
    .mockResolvedValue(undefined);
  const first = feedService.toggleLike("post", "actor", "Actor");
  const duplicate = feedService.toggleLike("post", "actor", "Actor");
  expect(get).toHaveBeenCalledTimes(1);
  finish({ exists: true, data: () => ({ likes: [], userId: "owner" }) });
  await expect(Promise.all([first, duplicate])).resolves.toEqual([true, true]);
  expect(update).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledTimes(1);
  get.mockResolvedValueOnce({
    exists: true,
    data: () => ({ likes: ["actor"], userId: "owner" }),
  });
  await expect(feedService.toggleLike("post", "actor")).resolves.toBe(false);
  expect(update).toHaveBeenCalledTimes(2);
  expect(notify).toHaveBeenCalledTimes(1);
});
