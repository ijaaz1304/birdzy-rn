import { EXPLORE_COLORS } from "../content/explore.colors";
import { EXPLORE_COPY } from "../content/explore.strings";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Mapbox, {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
  SymbolLayer,
  PointAnnotation,
  type MapState,
} from "@rnmapbox/maps";
type OnPressEvent = Parameters<
  NonNullable<React.ComponentProps<typeof ShapeSource>["onPress"]>
>[0];
import type { Feature, FeatureCollection } from "geojson";
import { MAPBOX_ACCESS_TOKEN } from "@/constants/env";
import { Icon, Text } from "../../../atoms";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import {
  ExploreTargetIcon,
  ExploreTargetIconDark,
  ExploreArrowShrinkIcon,
  ExploreArrowExpandIconDark,
  ExplorePinIcon,
  ExplorePlusIconDark,
  ExploreMinusIconDark,
} from "../assets";
import {
  ExploreMapGeoJSON,
  EMPTY_EXPLORE_MAP,
} from "@/features/explore/services/explore.api.types";
import { isValidCoordinate } from "@/features/explore/utils/locationCoordinates";

if (MAPBOX_ACCESS_TOKEN) Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];
const LOCATION_ZOOM = 12;
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const CLUSTER_FILTER = ["has", "point_count"] as const;
const POINT_FILTER = ["!", ["has", "point_count"]] as const;
// Radius now reflects point_count so circle size is actually meaningful —
// previously every cluster (and every lone point) rendered at the same
// fixed 24px, which made it look like size encoded something about the
// birds inside when it didn't. Lone points (no point_count at all,
// via POINT_FILTER) stay at the smallest size below, visually confirming
// "just one" rather than looking identical to a real cluster.
const CLUSTER_CIRCLE = {
  circleRadius: [
    "step",
    ["get", "point_count"],
    16,
    5,
    24,
    20,
    32,
    50,
    40,
  ] as unknown as number,
  circleColor: EXPLORE_COLORS.sightingsFill,
  circleOpacity: EXPLORE_COLORS.sightingsOpacity,
  circleStrokeWidth: 1,
  circleStrokeColor: EXPLORE_COLORS.sightingsStroke,
};
const CLUSTER_TEXT = {
  textField: "{point_count}",
  textSize: 12,
  textColor: EXPLORE_COLORS.sightingsStroke,
  textAllowOverlap: true,
};
const POINT_CIRCLE = {
  circleRadius: 10,
  circleColor: EXPLORE_COLORS.sightingsFill,
  circleOpacity: EXPLORE_COLORS.sightingsOpacity,
  circleStrokeWidth: 1,
  circleStrokeColor: EXPLORE_COLORS.sightingsStroke,
};
const SELECTED_CIRCLE = {
  circleRadius: 63.82,
  circleColor: EXPLORE_COLORS.selectedFill,
  circleOpacity: EXPLORE_COLORS.selectedOpacity,
  circleStrokeWidth: 1,
  circleStrokeColor: EXPLORE_COLORS.selectedStroke,
};

export type ExploreMapViewProps = {
  center?: [number, number];
  instant?: boolean;
  geoJSON?: ExploreMapGeoJSON;
  onSelectionChange?: (archetypeIds: string[] | null) => void;
  clearSelectionSignal?: number;
  /**
   * The embedded map's own search bar lives in ExploreMapScreen, overlaid
   * on top of this component from outside. The expanded full-screen Modal
   * below has no equivalent overlay from the parent, so it renders this
   * instead — same search bar instance, passed down so there's exactly one
   * EXPLORE_COPY.enterLocation control per visible map, matching the Figma expanded
   * frame.
   */
  headerOverlay?: React.ReactNode;
  /**
   * "Birds in This Area" preview panel — only meaningful inside the
   * expanded full-screen Modal (the collapsed map's equivalent lives below
   * it in ExploreMapScreen already, via the full result list).
   */
  selectionOverlay?: React.ReactNode;
};

/** Camera commands are imperative; native gesture state is saved for controls and remounts. */
export const ExploreMapView: React.FC<ExploreMapViewProps> = ({
  center,
  instant,
  geoJSON = EMPTY_EXPLORE_MAP,
  onSelectionChange,
  clearSelectionSignal,
  headerOverlay,
  selectionOverlay,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const camera = useRef<Camera>(null);
  const source = useRef<ShapeSource>(null);
  const savedCamera = useRef({
    centerCoordinate: center ?? DEFAULT_CENTER,
    zoomLevel: center ? LOCATION_ZOOM : 4.5,
    heading: 0,
    pitch: 0,
  });
  const [initialCamera, setInitialCamera] = useState(savedCamera.current);
  const [zoom, setZoom] = useState(savedCamera.current.zoomLevel);
  const [expanded, setExpanded] = useState(false);
  const [instance, setInstance] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    MAPBOX_ACCESS_TOKEN ? "loading" : "error"
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [excluded, setExcluded] = useState<Set<string | number>>(new Set());
  const selectionGeneration = useRef(0);
  const selectionCallback = useRef(onSelectionChange);
  selectionCallback.current = onSelectionChange;

  const clearSelection = useCallback(() => {
    selectionGeneration.current++;
    setSelected(null);
    setExcluded(new Set());
    selectionCallback.current?.(null);
  }, []);
  const moveCamera = useCallback(
    (coordinate: [number, number], nextZoom: number, duration: number) => {
      const bounded = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
      savedCamera.current = {
        ...savedCamera.current,
        centerCoordinate: coordinate,
        zoomLevel: bounded,
      };
      setZoom(bounded);
      camera.current?.setCamera({
        ...savedCamera.current,
        animationDuration: duration,
        animationMode: "easeTo",
      });
    },
    []
  );
  const lng = center?.[0];
  const lat = center?.[1];
  useEffect(() => {
    clearSelection();
    moveCamera(
      lng != null && lat != null ? [lng, lat] : DEFAULT_CENTER,
      lng != null ? LOCATION_ZOOM : 4.5,
      instant ? 0 : 800
    );
  }, [lng, lat, instant, moveCamera, clearSelection]);
  useEffect(() => {
    clearSelection();
  }, [geoJSON, clearSelectionSignal, clearSelection]);
  useEffect(
    () => () => {
      selectionGeneration.current++;
    },
    []
  );
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setStatus("error"), 20000);
    return () => clearTimeout(timer);
  }, [status, instance, expanded]);

  const shape = useMemo(
    () =>
      excluded.size
        ? {
            ...geoJSON,
            features: geoJSON.features.filter(
              (feature) => !excluded.has(feature.id!)
            ),
          }
        : geoJSON,
    [geoJSON, excluded]
  );

  const onActivityPress = async (event: OnPressEvent) => {
    const feature = event.features[0];
    if (feature?.geometry.type !== "Point") return;
    const [longitude, latitude] = feature.geometry.coordinates;
    if (!isValidCoordinate(latitude, longitude)) return;
    const coordinate: [number, number] = [longitude, latitude];
    const count = feature.properties?.point_count;
    const generation = ++selectionGeneration.current;
    const tappedSource = source.current;
    let leaves: Feature[] = [feature];
    try {
      if (typeof count === "number" && tappedSource) {
        leaves = [];
        // Bound each native bridge payload and abandon work as soon as the selection changes.
        for (let offset = 0; offset < count; offset += 200) {
          const page = (await tappedSource.getClusterLeaves(
            feature,
            Math.min(200, count - offset),
            offset
          )) as FeatureCollection;
          if (
            generation !== selectionGeneration.current ||
            tappedSource !== source.current
          )
            return;
          leaves.push(...page.features);
          if (!page.features.length) break;
        }
      }
      if (generation !== selectionGeneration.current) return;
      const ids = [
        ...new Set(
          leaves
            .map((leaf) => leaf.properties?.birdsLifeId)
            .filter((id): id is string => typeof id === "string")
        ),
      ];
      setSelected(coordinate);
      setExcluded(
        new Set(leaves.flatMap((leaf) => (leaf.id == null ? [] : [leaf.id])))
      );
      selectionCallback.current?.(ids.length ? ids : null);
      const nextZoom =
        typeof count === "number"
          ? savedCamera.current.zoomLevel + 2
          : Math.max(savedCamera.current.zoomLevel, 14);
      moveCamera(coordinate, nextZoom, 500);
    } catch {
      if (generation === selectionGeneration.current) clearSelection();
    }
  };
  const saveCamera = (state: MapState) => {
    const coordinate = state.properties.center;
    if (!isValidCoordinate(coordinate[1], coordinate[0])) return;
    savedCamera.current = {
      centerCoordinate: [coordinate[0], coordinate[1]],
      zoomLevel: state.properties.zoom,
      heading: Number.isFinite(state.properties.heading)
        ? state.properties.heading
        : savedCamera.current.heading,
      pitch: Number.isFinite(state.properties.pitch)
        ? state.properties.pitch
        : savedCamera.current.pitch,
    };
  };
  const changePresentation = (value: boolean) => {
    selectionGeneration.current++;
    setInitialCamera(savedCamera.current);
    setStatus("loading");
    setExpanded(value);
  };
  const buttonStyle = [
    styles.button,
    {
      backgroundColor: theme.colors.surfacePrimary,
      borderColor: theme.colors.border0,
    },
  ];
  const content = (
    <>
      {MAPBOX_ACCESS_TOKEN ? (
        <MapView
          key={instance}
          style={styles.map}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
          onDidFinishLoadingMap={() => setStatus("ready")}
          onMapLoadingError={() => setStatus("error")}
          onCameraChanged={saveCamera}
          onMapIdle={(state) => {
            saveCamera(state);
            setZoom(state.properties.zoom);
          }}
        >
          <Camera
            ref={camera}
            defaultSettings={initialCamera}
            minZoomLevel={MIN_ZOOM}
            maxZoomLevel={MAX_ZOOM}
          />
          <ShapeSource
            ref={source}
            id="explore-sightings"
            shape={shape}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={16}
            onPress={onActivityPress}
          >
            <CircleLayer
              id="explore-clusters"
              filter={CLUSTER_FILTER}
              style={CLUSTER_CIRCLE}
            />
            <SymbolLayer
              id="explore-counts"
              filter={CLUSTER_FILTER}
              style={CLUSTER_TEXT}
            />
            <CircleLayer
              id="explore-points"
              filter={POINT_FILTER}
              style={POINT_CIRCLE}
            />
          </ShapeSource>
          {selected && (
            <ShapeSource
              id="explore-selection"
              shape={{
                type: "Feature",
                geometry: { type: "Point", coordinates: selected },
                properties: {},
              }}
            >
              <CircleLayer
                id="explore-selection-circle"
                style={SELECTED_CIRCLE}
              />
            </ShapeSource>
          )}
          {center && (
            <PointAnnotation
              id="explore-location"
              coordinate={center}
              anchor={{ x: 0.5, y: 24 / 35 }}
            >
              <ExplorePinIcon width={24} height={35} />
            </PointAnnotation>
          )}
        </MapView>
      ) : null}
      {expanded && headerOverlay && (
        <View style={styles.expandedSearchOverlay}>{headerOverlay}</View>
      )}
      {expanded && selected && selectionOverlay && (
        <View
          style={[
            styles.expandedSelectionOverlay,
            { backgroundColor: theme.colors.surfacePrimary },
          ]}
        >
          {selectionOverlay}
        </View>
      )}
      {status !== "ready" && (
        <View
          style={[styles.overlay, { backgroundColor: theme.colors.background }]}
          pointerEvents={status === "loading" ? "none" : "auto"}
        >
          {status === "loading" ? (
            <ActivityIndicator
              accessibilityLabel={EXPLORE_COPY.loadingMap}
              size="large"
              color={theme.colors.primary}
            />
          ) : (
            <>
              <Text accessibilityRole="alert">
                {MAPBOX_ACCESS_TOKEN
                  ? EXPLORE_COPY.mapFailed
                  : EXPLORE_COPY.mapUnavailable}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={!MAPBOX_ACCESS_TOKEN && styles.hidden}
                accessibilityLabel={EXPLORE_COPY.retryMap}
                onPress={() => {
                  selectionGeneration.current++;
                  setInitialCamera(savedCamera.current);
                  setStatus("loading");
                  setInstance((value) => value + 1);
                }}
              >
                <Text color="primary">{EXPLORE_COPY.retry}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      <View
        style={[styles.zoomControls, !MAPBOX_ACCESS_TOKEN && styles.hidden]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={EXPLORE_COPY.zoomIn}
          accessibilityState={{ disabled: zoom >= MAX_ZOOM }}
          disabled={zoom >= MAX_ZOOM}
          style={buttonStyle}
          onPress={() =>
            moveCamera(
              savedCamera.current.centerCoordinate,
              savedCamera.current.zoomLevel + 1,
              200
            )
          }
        >
          {isDark ? (
            <ExplorePlusIconDark width={20} height={20} />
          ) : (
            <Icon name="plus" size={20} color={theme.colors.textPrimary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={EXPLORE_COPY.zoomOut}
          accessibilityState={{ disabled: zoom <= MIN_ZOOM }}
          disabled={zoom <= MIN_ZOOM}
          style={buttonStyle}
          onPress={() =>
            moveCamera(
              savedCamera.current.centerCoordinate,
              savedCamera.current.zoomLevel - 1,
              200
            )
          }
        >
          {isDark ? (
            <ExploreMinusIconDark width={20} height={20} />
          ) : (
            <Icon name="minus" size={20} color={theme.colors.textPrimary} />
          )}
        </TouchableOpacity>
      </View>
      <View
        style={[styles.bottomControls, !MAPBOX_ACCESS_TOKEN && styles.hidden]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={EXPLORE_COPY.recenter}
          accessibilityState={{ disabled: !center }}
          disabled={!center}
          style={buttonStyle}
          onPress={() => {
            if (center) {
              clearSelection();
              moveCamera(center, LOCATION_ZOOM, 500);
            }
          }}
        >
          {isDark ? (
            <ExploreTargetIconDark width={18} height={18} />
          ) : (
            <ExploreTargetIcon width={18} height={18} />
          )}
        </TouchableOpacity>
        {!expanded && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.expand}
            style={buttonStyle}
            onPress={() => changePresentation(true)}
          >
            {isDark ? (
              <ExploreArrowExpandIconDark width={16} height={16} />
            ) : (
              <ExploreArrowShrinkIcon width={16} height={16} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  return (
    <View style={styles.container}>
      {!expanded && content}
      <Modal
        visible={expanded}
        animationType="slide"
        onRequestClose={() => changePresentation(false)}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["top", "bottom"]}
        >
          <View style={styles.header}>
            <Text weight="semibold">{EXPLORE_COPY.title}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={EXPLORE_COPY.closeMap}
              onPress={() => changePresentation(false)}
              hitSlop={8}
            >
              <Icon name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.map}>{expanded && content}</View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  hidden: { display: "none" },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  zoomControls: { position: "absolute", top: 64, left: 8, gap: 4 },
  expandedSearchOverlay: { position: "absolute", top: 12, left: 8, right: 8 },
  expandedSelectionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bottomControls: { position: "absolute", bottom: 8, right: 8, gap: 4 },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
