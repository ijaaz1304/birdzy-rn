import { useCallback, useEffect, useRef, useState } from "react";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import type { GalleryAlbum, GalleryPhoto } from "./galleryPhoto.types";

const PAGE_SIZE = 36;
const LOAD_MORE_COOLDOWN_MS = 400;

function mapEdge(edge: {
  node: {
    id: string;
    image: {
      uri: string;
      width?: number;
      height?: number;
      filename?: string | null;
    };
  };
}): GalleryPhoto {
  return {
    id: edge.node.id,
    uri: edge.node.image.uri,
    width: edge.node.image.width,
    height: edge.node.image.height,
    filename: edge.node.image.filename ?? undefined,
  };
}

export function useDevicePhotoLibrary(enabled: boolean) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);
  const loadMoreCooldownRef = useRef(false);

  const loadAlbums = useCallback(async () => {
    try {
      const result = await CameraRoll.getAlbums({
        assetType: "Photos",
        albumType: "All",
      });
      const mapped = result
        .filter((a) => a.count > 0)
        .map((a) => ({ title: a.title, count: a.count }));
      setAlbums(mapped);
    } catch (error) {
      console.error("Failed to load albums:", error);
    }
  }, []);

  const loadPhotos = useCallback(
    async (reset: boolean) => {
      if (!enabled || loadingRef.current) return;
      loadingRef.current = true;
      if (reset) {
        setLoading(true);
        cursorRef.current = undefined;
      } else {
        setLoadingMore(true);
      }

      try {
        const page = await CameraRoll.getPhotos({
          first: PAGE_SIZE,
          after: reset ? undefined : cursorRef.current,
          assetType: "Photos",
          groupTypes: activeAlbum ? "Album" : "All",
          groupName: activeAlbum,
          include: ["filename", "imageSize"],
        });

        const batch = page.edges.map(mapEdge);
        cursorRef.current = page.page_info.end_cursor ?? undefined;
        setHasNextPage(page.page_info.has_next_page);
        setPhotos((prev) => (reset ? batch : [...prev, ...batch]));
      } catch (error) {
        console.error("Failed to load photos:", error);
        if (reset) setPhotos([]);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeAlbum, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    loadAlbums();
  }, [enabled, loadAlbums]);

  useEffect(() => {
    if (!enabled) return;
    loadPhotos(true);
  }, [enabled, activeAlbum, loadPhotos]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || loadingRef.current || loadMoreCooldownRef.current) {
      return;
    }
    loadMoreCooldownRef.current = true;
    void loadPhotos(false).finally(() => {
      setTimeout(() => {
        loadMoreCooldownRef.current = false;
      }, LOAD_MORE_COOLDOWN_MS);
    });
  }, [hasNextPage, loadPhotos]);

  const selectAlbum = useCallback((title: string | undefined) => {
    setActiveAlbum(title);
  }, []);

  return {
    photos,
    albums,
    activeAlbum,
    selectAlbum,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
    refresh: () => loadPhotos(true),
  };
}
