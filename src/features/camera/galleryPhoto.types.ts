export type GalleryPhoto = {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  filename?: string;
};

export type GalleryAlbum = {
  title: string;
  count: number;
};
