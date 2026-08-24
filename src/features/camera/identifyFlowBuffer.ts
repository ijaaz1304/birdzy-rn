import type { AppLog, LogLevel } from "../app-logs/app-logs.store";

/** In-memory ring buffer — avoids Zustand updates on every camera/gallery step. */
const MAX_IDENTIFY_FLOW_LOGS = 250;
let buffer: AppLog[] = [];
let revision = 0;
const listeners = new Set<() => void>();

export function getIdentifyFlowLogRevision(): number {
  return revision;
}

export function subscribeIdentifyFlowLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function appendIdentifyFlowLog(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!__DEV__) return;
  buffer.push({
    id: `if-${Date.now()}-${Math.random()}`,
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  });
  if (buffer.length > MAX_IDENTIFY_FLOW_LOGS) {
    buffer = buffer.slice(-MAX_IDENTIFY_FLOW_LOGS);
  }
  revision += 1;
  listeners.forEach((l) => l());
}

export function getIdentifyFlowLogs(): readonly AppLog[] {
  return buffer;
}

export function clearIdentifyFlowLogs(): void {
  buffer = [];
  revision += 1;
  listeners.forEach((l) => l());
}
