import {
  imageUrlsWithUserCaptureFirst,
  isRemoteImageUrl,
  publicUrlForUploadedPath,
  specimenUpdateWithoutImages,
  toPublicStorageDisplayUrl,
  unwrapEmbeddedImageUrl,
  USER_COLLECTION_PHOTO_STORAGE_PATH,
} from "../../src/features/collection/userCollectionPhoto";

const photo =
  "https://storage.googleapis.com/birdzy-app.firebasestorage.app/posts/images/specimen-capture-1.jpg";

it("puts the user photo first and keeps catalogue photos", () => {
  expect(
    imageUrlsWithUserCaptureFirst(photo, [
      "https://cdn.test/catalogue.jpg",
      photo,
    ])
  ).toEqual([photo, "https://cdn.test/catalogue.jpg"]);
});

it("uploads only under the storage path the rules already allow", () => {
  expect(USER_COLLECTION_PHOTO_STORAGE_PATH).toBe("posts/images");
  expect(
    publicUrlForUploadedPath(
      "https://storage.googleapis.com/birdzy-app.firebasestorage.app",
      "posts/images/specimen-capture-1.jpg"
    )
  ).toBe(photo);
});

it("uses the inner photo when the list glues it onto a catalogue path", () => {
  const glued =
    "https://storage.googleapis.com/birdzy-app.firebasestorage.app/scraped/birds/robin/" +
    photo;
  expect(unwrapEmbeddedImageUrl(glued)).toBe(photo);
  expect(toPublicStorageDisplayUrl(glued)).toBe(photo);
});

it("turns a token download URL into the public storage URL", () => {
  const download =
    "https://firebasestorage.googleapis.com/v0/b/birdzy-app.firebasestorage.app/o/posts%2Fimages%2Fspecimen-capture-1.jpg?alt=media&token=abc";
  expect(toPublicStorageDisplayUrl(download)).toBe(photo);
});

it("never sends image fields on specimen update", () => {
  expect(
    specimenUpdateWithoutImages({
      isIdentified: true,
      imageUrls: [photo],
      images: ["catalogue.jpg"],
      userCapturedImages: [photo],
    })
  ).toEqual({ isIdentified: true });
});

it("treats only http(s) as already uploaded", () => {
  expect(isRemoteImageUrl(photo)).toBe(true);
  expect(isRemoteImageUrl("file:///tmp/capture.jpg")).toBe(false);
  expect(isRemoteImageUrl("content://media/1")).toBe(false);
});
