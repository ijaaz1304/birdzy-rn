import { buildBirdPhotoGallery } from "../../src/features/collection/birdPhotoGallery";
it("prepends the captured photo unbadged and labels catalogue references", () => {
  expect(
    buildBirdPhotoGallery(
      ["https://example.com/bird.jpg"],
      ["/private/tmp/capture.jpg"]
    )
  ).toEqual([
    {
      id: "photo-0",
      uri: "file:///private/tmp/capture.jpg",
      isReference: false,
    },
    { id: "photo-1", uri: "https://example.com/bird.jpg", isReference: true },
  ]);
});
it("normalizes uploaded captures and deduplicates equivalent storage URLs", () => {
  const token =
    "https://firebasestorage.googleapis.com/v0/b/bucket/o/posts%2Fimages%2Fa.jpg?alt=media";
  const uri = "https://storage.googleapis.com/bucket/posts/images/a.jpg";
  expect(buildBirdPhotoGallery([token, uri])).toEqual([
    { id: "photo-0", uri, isReference: false },
  ]);
});
it("does not call a catalogue-only first image a capture", () => {
  expect(
    buildBirdPhotoGallery(["https://example.com/bird.jpg"])[0].isReference
  ).toBe(true);
});
it("rejects unsupported or blank images and preserves device photos", () => {
  expect(
    buildBirdPhotoGallery([
      "",
      "unsupported:bad",
      "content://photo/1",
      "ph://asset/2",
    ])
  ).toEqual([
    { id: "photo-0", uri: "content://photo/1", isReference: false },
    { id: "photo-1", uri: "ph://asset/2", isReference: false },
  ]);
});
