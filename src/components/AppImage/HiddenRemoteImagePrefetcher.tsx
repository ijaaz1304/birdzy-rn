import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import { markRemoteImageCacheReady } from "../../utils/prefetchImages";

type Props = {
  uris: string[];
  decodeWidth: number;
  decodeHeight: number;
  onAllSettled?: () => void;
};

/**
 * Off-screen FastImage views that actually download + decode at list-thumb size.
 * FastImage.preload() has no completion signal and often skips the view cache
 * on Android — this is what makes Possible Matches thumbnails ready to paint.
 */
export function HiddenRemoteImagePrefetcher({
  uris,
  decodeWidth,
  decodeHeight,
  onAllSettled,
}: Props) {
  const urisKey = uris.join("\0");
  const urisKeyRef = useRef(urisKey);
  const pendingRef = useRef<Set<string>>(new Set(uris));
  const settledRef = useRef(false);
  const onAllSettledRef = useRef(onAllSettled);
  onAllSettledRef.current = onAllSettled;

  if (urisKeyRef.current !== urisKey) {
    urisKeyRef.current = urisKey;
    settledRef.current = false;
    pendingRef.current = new Set(uris);
  }

  useEffect(() => {
    if (uris.length === 0 && !settledRef.current) {
      settledRef.current = true;
      onAllSettledRef.current?.();
    }
  }, [urisKey, uris.length]);

  const settle = (uri: string) => {
    if (settledRef.current) return;
    pendingRef.current.delete(uri);
    markRemoteImageCacheReady(uri);
    if (pendingRef.current.size === 0) {
      settledRef.current = true;
      onAllSettledRef.current?.();
    }
  };

  const uniqueUris = uris.filter((uri, index) => uri && uris.indexOf(uri) === index);
  if (uniqueUris.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.host,
        { width: decodeWidth, height: decodeHeight * uniqueUris.length },
      ]}
    >
      {uniqueUris.map((uri, index) => (
        <FastImage
          key={`${index}:${uri}`}
          source={{
            uri,
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={{
            position: "absolute",
            top: index * decodeHeight,
            width: decodeWidth,
            height: decodeHeight,
          }}
          resizeMode={FastImage.resizeMode.cover}
          onLoad={() => settle(uri)}
          onError={() => settle(uri)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: -10000,
    top: 0,
    overflow: "hidden",
  },
});
