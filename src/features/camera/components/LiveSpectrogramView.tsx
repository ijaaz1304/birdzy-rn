/**
 * Live mel spectrogram — SVG renderer (capped column/band budget for device perf).
 */
import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import {
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
  SPECTROGRAM_DISPLAY_MIN_COLUMN_PX,
} from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
} from "../utils/soundPerf";

type Props = {
  height?: number;
  /** Mel columns — each column is normalized band energies (bottom = low freq). */
  columns: number[][];
  playheadCenter?: boolean;
};

const PLAYHEAD_COLOR = "#EF4444";
const BG = "#E8E8E8";
const QUIET_GRAY = 0xe8;
const LOUD_GRAY = 0x5a;

function melValueToFill(value: number): string {
  const t = Math.min(1, Math.max(0, value));
  const v = Math.round(QUIET_GRAY - t * (QUIET_GRAY - LOUD_GRAY));
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}

/** Max-pool downsample for sharper bands when rendering fewer than computed mel bins. */
function downsampleBands(column: number[], targetBands: number): number[] {
  if (column.length <= targetBands) return column;
  const out = new Array<number>(targetBands);
  const step = column.length / targetBands;
  for (let i = 0; i < targetBands; i += 1) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    let peak = 0;
    for (let j = start; j < end; j += 1) {
      peak = Math.max(peak, column[j] ?? 0);
    }
    out[i] = peak;
  }
  return out;
}

function layoutCenterPlayheadColumns(
  columns: number[][],
  maxCols: number,
  displayBands: number
): Array<number[] | null> {
  if (maxCols <= 0) return [];
  const playheadIndex = Math.floor(maxCols / 2);
  const maxHistory = playheadIndex + 1;
  const history = columns.slice(-maxHistory);
  const startPad = playheadIndex - history.length + 1;
  const grid: Array<number[] | null> = Array.from(
    { length: maxCols },
    () => null
  );
  for (let i = 0; i < history.length; i += 1) {
    const column = history[i];
    grid[startPad + i] = column ? downsampleBands(column, displayBands) : null;
  }
  return grid;
}

function buildColumnRects(
  column: number[],
  colIndex: number,
  columnWidth: number,
  bandHeight: number
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  for (let bandIndex = 0; bandIndex < column.length; bandIndex += 1) {
    nodes.push(
      <Rect
        key={`${colIndex}-${bandIndex}`}
        x={colIndex * columnWidth}
        y={bandIndex * bandHeight}
        width={Math.max(1, columnWidth)}
        height={Math.max(1, bandHeight + 0.5)}
        fill={melValueToFill(column[bandIndex] ?? 0)}
      />
    );
  }
  return nodes;
}

function layoutFullTrackColumns(
  columns: number[][],
  maxCols: number,
  displayBands: number
): number[][] {
  if (maxCols <= 0 || columns.length === 0) return [];
  if (columns.length <= maxCols) {
    return columns.map((column) => downsampleBands(column, displayBands));
  }
  const out: number[][] = [];
  const step = columns.length / maxCols;
  for (let i = 0; i < maxCols; i += 1) {
    const idx = Math.min(columns.length - 1, Math.floor(i * step));
    out.push(downsampleBands(columns[idx] ?? [], displayBands));
  }
  return out;
}

function LiveSpectrogramViewComponent({
  height = 100,
  columns,
  playheadCenter = true,
}: Props) {
  logSoundRenderCount("LiveSpectrogramView");
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const maxCols =
    width > 0
      ? Math.min(
          SPECTROGRAM_DISPLAY_MAX_COLUMNS,
          Math.max(1, Math.floor(width / SPECTROGRAM_DISPLAY_MIN_COLUMN_PX))
        )
      : 0;

  const displayBands = SPECTROGRAM_DISPLAY_MEL_BANDS;

  const visibleColumns = useMemo(() => {
    if (maxCols <= 0) return [] as Array<number[] | null>;
    if (!playheadCenter) {
      return layoutFullTrackColumns(columns, maxCols, displayBands);
    }
    return layoutCenterPlayheadColumns(columns, maxCols, displayBands);
  }, [columns, displayBands, maxCols, playheadCenter]);

  const columnWidth =
    maxCols > 0
      ? width / (playheadCenter ? maxCols : visibleColumns.length)
      : 1;
  const bandHeight = height / displayBands;
  const playheadX = playheadCenter ? width / 2 : width;
  const rects = useMemo(() => {
    const perf = isSoundPerfEnabled();
    const renderStart = perf ? soundPerfNow() : 0;

    const colCount = playheadCenter ? maxCols : visibleColumns.length;
    const nodes: React.ReactNode[] = [];
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const column = visibleColumns[colIndex];
      if (column)
        nodes.push(
          ...buildColumnRects(column, colIndex, columnWidth, bandHeight)
        );
    }

    if (perf) {
      soundPerfRecordTiming("SvgRender", soundPerfNow() - renderStart);
    }
    return nodes;
  }, [bandHeight, columnWidth, maxCols, playheadCenter, visibleColumns]);

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {width > 0 ? (
        <View style={styles.trackInner}>
          <Svg width={width} height={height}>
            <Rect x={0} y={0} width={width} height={height} fill={BG} />
            {rects}
            {playheadCenter ? (
              <Line
                x1={playheadX}
                y1={0}
                x2={playheadX}
                y2={height}
                stroke={PLAYHEAD_COLOR}
                strokeWidth={2}
              />
            ) : null}
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

function spectrogramColumnsEqual(prev: number[][], next: number[][]): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  if (prev.length === 0) return true;
  return prev.every((column, index) => column === next[index]);
}

export const LiveSpectrogramView = React.memo(
  LiveSpectrogramViewComponent,
  (prev, next) =>
    prev.height === next.height &&
    prev.playheadCenter === next.playheadCenter &&
    spectrogramColumnsEqual(prev.columns, next.columns)
);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: BG,
  },
  trackInner: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
});
