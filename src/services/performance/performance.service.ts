/**
 * Performance Monitoring Service
 * Tracks app performance metrics using Firebase Performance Monitoring
 */

import { firebasePerf } from "../../lib/firebase";
import type { FirebasePerformanceTypes } from "@react-native-firebase/perf";
import { getRemoteConfigValue } from "../remoteConfig";

type PerfTrace = FirebasePerformanceTypes.Trace;

class PerformanceService {
  private traces: Map<string, PerfTrace> = new Map();
  private screenTraces: Map<string, PerfTrace> = new Map();
  private apiTraces: Map<string, PerfTrace> = new Map();
  private isEnabled: boolean = true;
  private appLaunchStartTime: number = 0;
  private appLaunchTrace: PerfTrace | null = null;
  private networkFailureCount: number = 0;
  private networkFailureDetails: Array<{
    endpoint: string;
    error: string;
    timestamp: number;
  }> = [];

  /**
   * Initialize performance monitoring
   * Guards against Firebase not being ready
   */
  async initialize(): Promise<void> {
    try {
      // Check Firebase readiness - no time-based delays
      const { isFirebaseInitialized } = require("../../lib/firebase");
      if (!isFirebaseInitialized()) {
        // Firebase not ready - silently return
        // Will initialize on next invocation
        if (__DEV__) {
          console.log("Firebase not ready for Performance Monitoring");
        }
        return;
      }

      // Enable performance collection in all environments
      await firebasePerf.setPerformanceCollectionEnabled(true);

      // Start app launch trace
      this.appLaunchStartTime = Date.now();
      this.appLaunchTrace = await this.startTrace("app_launch");
    } catch (error) {
      // Silently fail - Firebase might not be ready yet
      if (__DEV__) {
        console.warn("Performance monitoring initialization error:", error);
      }
    }
  }

  /**
   * Complete app launch trace
   * Call this when app is fully loaded
   */
  async completeAppLaunchTrace(): Promise<void> {
    if (this.appLaunchTrace) {
      try {
        const duration = Date.now() - this.appLaunchStartTime;
        await this.addMetric("app_launch", "launch_duration_ms", duration);
        await this.stopTrace("app_launch");
        this.appLaunchTrace = null;

        if (__DEV__) {
          console.log(`App launch duration: ${duration}ms`);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to complete app launch trace:", error);
        }
      }
    }
  }

  /**
   * Start a performance trace
   */
  async startTrace(traceName: string): Promise<PerfTrace | null> {
    if (!this.isEnabled) return null;

    try {
      const trace = await firebasePerf.startTrace(traceName);
      this.traces.set(traceName, trace);
      return trace;
    } catch (error) {
      console.error(`Error starting trace ${traceName}:`, error);
      return null;
    }
  }

  /**
   * Stop a performance trace
   */
  async stopTrace(traceName: string): Promise<void> {
    const trace = this.traces.get(traceName);
    if (!trace) {
      console.warn(`Trace ${traceName} not found`);
      return;
    }

    try {
      await trace.stop();
      this.traces.delete(traceName);
    } catch (error) {
      console.error(`Error stopping trace ${traceName}:`, error);
    }
  }

  /**
   * Add metric to trace
   */
  async addMetric(
    traceName: string,
    metricName: string,
    value: number
  ): Promise<void> {
    const trace = this.traces.get(traceName);
    if (!trace) {
      console.warn(`Trace ${traceName} not found`);
      return;
    }

    try {
      await trace.putMetric(metricName, value);
    } catch (error) {
      console.error(`Error adding metric to trace ${traceName}:`, error);
    }
  }

  /**
   * Add attribute to trace
   */
  async addAttribute(
    traceName: string,
    attributeName: string,
    value: string
  ): Promise<void> {
    const trace = this.traces.get(traceName);
    if (!trace) {
      console.warn(`Trace ${traceName} not found`);
      return;
    }

    try {
      await trace.putAttribute(attributeName, value);
    } catch (error) {
      console.error(`Error adding attribute to trace ${traceName}:`, error);
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    traceName: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const trace = await this.startTrace(traceName);

    if (attributes && trace) {
      for (const [key, value] of Object.entries(attributes)) {
        await this.addAttribute(traceName, key, value);
      }
    }

    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      if (trace) {
        await this.addMetric(traceName, "duration_ms", duration);
      }

      await this.stopTrace(traceName);
      return result;
    } catch (error) {
      await this.stopTrace(traceName);
      throw error;
    }
  }

  /**
   * Measure sync function execution time
   */
  measureSync<T>(
    traceName: string,
    fn: () => T,
    attributes?: Record<string, string>
  ): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;

      // For sync functions, we still create a trace but it's simpler
      this.startTrace(traceName).then(async (trace) => {
        if (trace) {
          if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
              await this.addAttribute(traceName, key, value);
            }
          }
          await this.addMetric(traceName, "duration_ms", duration);
          await this.stopTrace(traceName);
        }
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start screen trace
   */
  async startScreenTrace(screenName: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const traceName = `screen_${screenName}`;
      const trace = await this.startTrace(traceName);
      if (trace) {
        this.screenTraces.set(screenName, trace);
        await this.addAttribute(traceName, "screen_name", screenName);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to start screen trace for ${screenName}:`, error);
      }
    }
  }

  /**
   * Stop screen trace
   */
  async stopScreenTrace(screenName: string): Promise<void> {
    try {
      const traceName = `screen_${screenName}`;
      const trace = this.screenTraces.get(screenName);

      if (trace) {
        const _startTime = Date.now();
        // Calculate duration if we tracked start time
        await this.stopTrace(traceName);
        this.screenTraces.delete(screenName);

        if (__DEV__) {
          console.log(`Screen ${screenName} trace stopped`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to stop screen trace for ${screenName}:`, error);
      }
    }
  }

  /**
   * Start API trace
   */
  async startApiTrace(
    endpoint: string,
    method: string = "GET"
  ): Promise<PerfTrace | null> {
    if (!this.isEnabled) return null;

    try {
      // Sanitize endpoint for trace name (remove query params, special chars)
      const maxLength = getRemoteConfigValue("traceNameMaxLength");
      const sanitizedEndpoint = endpoint
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, maxLength);

      const traceName = `api_${method}_${sanitizedEndpoint}`;
      const trace = await this.startTrace(traceName);

      if (trace) {
        this.apiTraces.set(endpoint, trace);
        await this.addAttribute(traceName, "endpoint", endpoint);
        await this.addAttribute(traceName, "method", method);
      }

      return trace;
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to start API trace for ${endpoint}:`, error);
      }
      return null;
    }
  }

  /**
   * Stop API trace
   */
  async stopApiTrace(
    endpoint: string,
    method: string = "GET",
    statusCode: number,
    success: boolean
  ): Promise<void> {
    try {
      const maxLength = getRemoteConfigValue("traceNameMaxLength");
      const sanitizedEndpoint = endpoint
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, maxLength);

      const traceName = `api_${method}_${sanitizedEndpoint}`;
      const trace = this.apiTraces.get(endpoint);

      if (trace) {
        await this.addAttribute(
          traceName,
          "status_code",
          statusCode.toString()
        );
        await this.addAttribute(traceName, "success", success.toString());
        await this.stopTrace(traceName);
        this.apiTraces.delete(endpoint);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to stop API trace for ${endpoint}:`, error);
      }
    }
  }

  /**
   * Track network failure
   */
  async trackNetworkFailure(endpoint: string, error: string): Promise<void> {
    try {
      this.networkFailureCount++;
      this.networkFailureDetails.push({
        endpoint,
        error,
        timestamp: Date.now(),
      });

      // Keep only last N failures (from remote config)
      const failureLimit = getRemoteConfigValue("networkFailureHistoryLimit");
      if (this.networkFailureDetails.length > failureLimit) {
        this.networkFailureDetails.shift();
      }

      // Log to Crashlytics
      const { reportError } = require("../monitoring");
      await reportError(new Error(`Network failure: ${endpoint}`), {
        screen: "API",
        action: "network_failure",
        additionalData: {
          endpoint,
          error_message: error,
          failure_count: this.networkFailureCount.toString(),
        },
      });
    } catch (reportingError) {
      if (__DEV__) {
        console.warn("Failed to track network failure:", reportingError);
      }
    }
  }

  /**
   * Track session length
   */
  async trackSessionLength(sessionLengthSeconds: number): Promise<void> {
    try {
      const {
        analyticsService,
        EVENTS,
      } = require("../analytics/analytics.service");
      analyticsService.logEvent(EVENTS.session_length, {
        total_time_seconds: sessionLengthSeconds,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn("Failed to track session length:", error);
      }
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export const performanceService = new PerformanceService();
